// Este arquivo faz vários logins; o limite de autenticação é testado à parte.
process.env.AUTH_THROTTLE_LIMIT = '1000';

import { getConnectionToken } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';
import { Types } from 'mongoose';
import { Role } from '../src/modules/users/domain/role.js';
import { makeConsumer, makeProducer } from '@test/factories';
import { loginAs, seedAdmin, seedUser } from './utils/auth.js';
import {
  createProduct,
  registerProducer,
  samplePhoto,
} from './utils/products.js';
import { createTestApp, TestApp } from './utils/test-app.js';

const USERS = '/api/v1/users';
const MOTIVO = 'DESCUMPRIMENTO_REGRAS';

describe('Exclusão administrativa de contas (e2e)', () => {
  let t: TestApp;
  let photo: Buffer;

  beforeAll(async () => {
    t = await createTestApp();
    photo = await samplePhoto();
  });

  beforeEach(async () => {
    await t.clearDatabase();
  });

  afterAll(async () => {
    await t?.close();
  });

  const db = () => t.app.get<Connection>(getConnectionToken());
  const count = (collection: string, filter: object = {}) =>
    db().collection(collection).countDocuments(filter);

  async function adminLogin() {
    const admin = await seedAdmin(t);
    const res = await t
      .request()
      .post('/api/v1/auth/login')
      .send({ email: admin.email, senha: admin.senha })
      .expect(200);
    return {
      id: admin.user.id as string,
      auth: `Bearer ${res.body.accessToken as string}`,
    };
  }

  function remove(auth: string | undefined, id: string, motivo = MOTIVO) {
    let req = t.request().delete(`${USERS}/${id}`).query({ motivo });
    if (auth) req = req.set('Authorization', auth);
    return req;
  }

  /** Produtor com produto, experiência, perfil publicado, foto e pedido de nova senha. */
  async function producerWithContent() {
    const p = await registerProducer(t, { nomeIniciativa: 'Sítio Banido' });
    const product = await createProduct(t, p.auth, photo);
    const experience = await t
      .request()
      .post('/api/v1/experiences')
      .set('Authorization', p.auth)
      .field('nome', 'Trilha do sítio banido')
      .field('categoria', 'Experiência')
      .field('descricao', 'Caminhada guiada.')
      .field('valorPorPessoa', '30')
      .field('local', 'Cafuringa, DF')
      .field('duracao', '2 horas')
      .attach('fotos', photo, 'foto.jpg')
      .expect(201);
    await t
      .request()
      .put('/api/v1/producers/me/trajectory')
      .set('Authorization', p.auth)
      .send({ trajetoria: 'Nossa história.', atividades: 'Trilhas.' })
      .expect(200);
    await t
      .request()
      .put('/api/v1/producers/me/photo')
      .set('Authorization', p.auth)
      .attach('foto', photo, 'perfil.jpg')
      .expect(200);
    await t
      .request()
      .post('/api/v1/auth/password-reset/request')
      .send({ email: p.dto.email });
    return {
      ...p,
      productId: product.id,
      experienceId: experience.body.id as string,
    };
  }

  describe('CA04, CA08: exclusão confirmada', () => {
    it('204, a conta deixa de existir e não aparece mais na consulta', async () => {
      const admin = await adminLogin();
      const consumer = await seedUser(t, Role.CONSUMIDOR);
      const id = consumer.user.id as string;

      await remove(admin.auth, id).expect(204);

      await t
        .request()
        .get(`${USERS}/${id}`)
        .set('Authorization', admin.auth)
        .expect(404);
      const list = await t
        .request()
        .get(USERS)
        .set('Authorization', admin.auth)
        .expect(200);
      expect(list.body.itens.map((u: { id: string }) => u.id)).not.toContain(
        id,
      );
    });

    it('a conta excluída não entra mais e o token aberto deixa de valer', async () => {
      const admin = await adminLogin();
      const consumer = await seedUser(t, Role.CONSUMIDOR);
      const login = await t
        .request()
        .post('/api/v1/auth/login')
        .send({ email: consumer.email, senha: consumer.senha })
        .expect(200);
      const token = `Bearer ${login.body.accessToken as string}`;

      await remove(admin.auth, consumer.user.id as string).expect(204);

      await t
        .request()
        .get('/api/v1/auth/me')
        .set('Authorization', token)
        .expect(401);
      await t
        .request()
        .post('/api/v1/auth/login')
        .send({ email: consumer.email, senha: consumer.senha })
        .expect(401);
    });

    it('RNF11: produtor sai do catálogo com perfil, ofertas, fotos e pedidos de senha', async () => {
      const admin = await adminLogin();
      const p = await producerWithContent();
      const owner = new Types.ObjectId(p.id);
      expect(await count('photos')).toBe(2);
      // A foto de perfil (HU12) é gravada com o id da conta em texto; a busca
      // aceita os dois formatos para não depender disso.
      const profilePhoto = { _id: { $in: [owner, p.id] } } as object;
      expect(await count('producer_photos', profilePhoto)).toBe(1);

      await remove(admin.auth, p.id).expect(204);

      expect(await count('users', { _id: owner })).toBe(0);
      expect(await count('products', { produtor: owner })).toBe(0);
      expect(await count('experiences', { produtor: owner })).toBe(0);
      expect(await count('photos')).toBe(0);
      expect(await count('producer_photos', profilePhoto)).toBe(0);
      expect(await count('password_reset_tokens', { userId: owner })).toBe(0);
      const api = t.request();
      expect((await api.get('/api/v1/producers').expect(200)).body).toEqual([]);
      await api.get(`/api/v1/producers/${p.id}/trajectory`).expect(404);
      await api.get(`/api/v1/products/${p.productId}`).expect(404);
      await api.get(`/api/v1/experiences/${p.experienceId}`).expect(404);
      expect((await api.get('/api/v1/products').expect(200)).body.total).toBe(
        0,
      );
      expect(
        (await api.get('/api/v1/experiences').expect(200)).body.total,
      ).toBe(0);
    });
  });

  describe('Novo cadastro depois da exclusão', () => {
    const BANNED =
      'Não foi possível concluir o cadastro. Procure a administração da Rede Cafuringa.';

    it('inatividade: a mesma pessoa pode se cadastrar de novo com CPF e e-mail', async () => {
      const admin = await adminLogin();
      const dto = makeConsumer();
      const created = await t
        .request()
        .post(`${USERS}/consumers`)
        .send(dto)
        .expect(201);

      await remove(admin.auth, created.body.id, 'INATIVIDADE').expect(204);

      await t.request().post(`${USERS}/consumers`).send(dto).expect(201);
      expect(await count('banned_identities')).toBe(0);
    });

    it('banimento: CPF ou e-mail do consumidor banido não se cadastram de novo', async () => {
      const admin = await adminLogin();
      const dto = makeConsumer();
      const created = await t
        .request()
        .post(`${USERS}/consumers`)
        .send(dto)
        .expect(201);

      await remove(admin.auth, created.body.id).expect(204);

      for (const retry of [
        { ...makeConsumer(), cpf: dto.cpf },
        { ...makeConsumer(), email: dto.email.toUpperCase() },
      ]) {
        const res = await t
          .request()
          .post(`${USERS}/consumers`)
          .send(retry)
          .expect(403);
        expect(res.body.message).toBe(BANNED);
      }
      // Como consumidor ou como produtor: o bloqueio é da pessoa.
      await t
        .request()
        .post(`${USERS}/producers`)
        .send(makeProducer({ cpf: dto.cpf }))
        .expect(403);
      // RNF11: só hashes, nunca o dado em claro.
      const stored = JSON.stringify(
        await db().collection('banned_identities').find().toArray(),
      );
      expect(stored).not.toContain(dto.cpf);
      expect(stored).not.toContain(dto.email.toLowerCase());
      // Outra pessoa segue podendo se cadastrar.
      await t
        .request()
        .post(`${USERS}/consumers`)
        .send(makeConsumer())
        .expect(201);
    });

    it('banimento: o CNPJ do produtor banido também fica bloqueado', async () => {
      const admin = await adminLogin();
      const p = await registerProducer(t);

      await remove(admin.auth, p.id).expect(204);

      await t
        .request()
        .post(`${USERS}/producers`)
        .send(makeProducer({ cnpj: p.dto.cnpj }))
        .expect(403);
    });

    it('banimento: administrador banido não é recriado com o mesmo e-mail', async () => {
      const admin = await adminLogin();
      const other = await seedAdmin(t);

      await remove(admin.auth, other.user.id as string).expect(204);

      await t
        .request()
        .post(`${USERS}/admins`)
        .set('Authorization', admin.auth)
        .send({ email: other.email, senha: other.senha })
        .expect(403);
    });
  });

  describe('CA06: restrição de acesso', () => {
    it.each([Role.CONSUMIDOR, Role.PRODUTOR])(
      '403 para %s, e a conta continua',
      async (perfil) => {
        const target = await seedUser(t, Role.CONSUMIDOR);
        const token = await loginAs(t, perfil);

        await remove(`Bearer ${token}`, target.user.id as string).expect(403);

        expect(await count('users', { _id: target.user._id })).toBe(1);
      },
    );

    it('401 sem login', async () => {
      const target = await seedUser(t, Role.CONSUMIDOR);
      await remove(undefined, target.user.id as string).expect(401);
    });
  });

  describe('CA07: conta indisponível para exclusão', () => {
    it.each(['64b0c0ffee0000000000beef', 'nao-e-id'])(
      '404 em português para %s (inexistente ou já excluída)',
      async (id) => {
        const admin = await adminLogin();
        const res = await remove(admin.auth, id).expect(404);
        expect(res.body.message).toBe('Conta não encontrada ou já excluída');
      },
    );

    it('409 ao tentar excluir a própria conta, que continua ativa', async () => {
      const admin = await adminLogin();
      const res = await remove(admin.auth, admin.id).expect(409);
      expect(res.body.message).toBe(
        'Você não pode excluir a sua própria conta',
      );
      await t
        .request()
        .get('/api/v1/auth/me')
        .set('Authorization', admin.auth)
        .expect(200);
    });

    it('administrador pode excluir outro administrador', async () => {
      const admin = await adminLogin();
      const other = await seedAdmin(t);
      await remove(admin.auth, other.user.id as string).expect(204);
    });
  });

  describe('RN04: motivo obrigatório', () => {
    it.each([undefined, 'QUALQUER', 'NECESSIDADE_ADMINISTRATIVA'])(
      '400 para motivo %s',
      async (motivo) => {
        const admin = await adminLogin();
        const target = await seedUser(t, Role.CONSUMIDOR);
        let req = t
          .request()
          .delete(`${USERS}/${target.user.id as string}`)
          .set('Authorization', admin.auth);
        if (motivo) req = req.query({ motivo });
        await req.expect(400);
        expect(await count('users', { _id: target.user._id })).toBe(1);
      },
    );
  });
});
