process.env.AUTH_THROTTLE_LIMIT = '1000';

import { getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Experience } from '../src/modules/experiences/schemas/experience.schema.js';
import { Role } from '../src/modules/users/domain/role.js';
import { User } from '../src/modules/users/schemas/user.schema.js';
import { loginAs } from './utils/auth.js';
import { registerProducer, samplePhoto } from './utils/products.js';
import { createTestApp, TestApp } from './utils/test-app.js';

const EXPERIENCES = '/api/v1/experiences';

const validExperience = {
  nome: 'Trilha guiada da nascente',
  categoria: 'Experiência',
  descricao: 'Caminhada de 3 km até a nascente, com café da roça.',
  valorPorPessoa: '45.5',
  local: 'Sítio Boa Vista, Núcleo Rural Cafuringa',
  duracao: '2 horas',
};

type Fields = Partial<Record<keyof typeof validExperience, string>>;

describe('HU21/RF21 — Cadastrar experiência (e2e)', () => {
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

  const experiences = () =>
    t.app.get<Model<Experience>>(getModelToken(Experience.name));
  const users = () => t.app.get<Model<User>>(getModelToken(User.name));

  function post(
    auth: string | undefined,
    fields: Fields = {},
    { fotos = 1, key }: { fotos?: number; key?: string } = {},
  ) {
    let req = t.request().post(EXPERIENCES);
    if (auth) req = req.set('Authorization', auth);
    if (key) req = req.set('Idempotency-Key', key);
    for (const [name, value] of Object.entries({
      ...validExperience,
      ...fields,
    }))
      req = req.field(name, value);
    for (let i = 0; i < fotos; i++)
      req = req.attach('fotos', photo, `foto-${i}.jpg`);
    return req;
  }

  describe('CA01, CA02, CA03, CA05: produtor cadastra e a experiência fica vinculada a ele', () => {
    it('201 com os dados normalizados e o responsável vindo do token', async () => {
      const p = await registerProducer(t, {
        nomeIniciativa: 'Sítio Boa Vista',
        localidade: 'Núcleo Rural Cafuringa',
      });

      const res = await post(
        p.auth,
        { duracao: '  90  Minutos ' },
        { fotos: 2 },
      ).expect(201);

      expect(res.body).toMatchObject({
        nome: validExperience.nome,
        categoria: 'Experiência',
        descricao: validExperience.descricao,
        valorPorPessoa: 45.5,
        local: validExperience.local,
        duracao: '90 minutos',
        disponivel: true,
        produtor: {
          id: p.id,
          nomeIniciativa: 'Sítio Boa Vista',
          localidade: 'Núcleo Rural Cafuringa',
        },
      });
      expect(res.body.fotos).toHaveLength(2);
      const stored = await experiences().findById(res.body.id).lean().exec();
      expect(stored?.produtor.toString()).toBe(p.id);
      expect(stored?.valorCentavos).toBe(4550);
    });

    it('ignora um produtor informado no corpo (RN09): o dono é sempre o do token', async () => {
      const dono = await registerProducer(t);
      const outro = await registerProducer(t);

      const res = await t
        .request()
        .post(EXPERIENCES)
        .set('Authorization', dono.auth)
        .field({ ...validExperience, produtor: outro.id })
        .attach('fotos', photo, 'foto.jpg');

      // whitelist do ValidationPipe recusa campo desconhecido ou o descarta;
      // em nenhum caso a experiência pode ficar com o outro produtor.
      if (res.status === 201) expect(res.body.produtor.id).toBe(dono.id);
      else expect(res.status).toBe(400);
      expect(await experiences().countDocuments({ produtor: outro.id })).toBe(
        0,
      );
    });
  });

  describe('CA04: dados obrigatórios ausentes ou inválidos', () => {
    it.each([
      ['título vazio', { nome: ' ' }, 'Informe o título da experiência'],
      [
        'descrição vazia',
        { descricao: '' },
        'Informe a descrição da experiência',
      ],
      ['local vazio', { local: '' }, 'Informe o local da experiência'],
      [
        'valor negativo',
        { valorPorPessoa: '-1' },
        'Informe um valor por pessoa válido',
      ],
      [
        'valor com 3 casas',
        { valorPorPessoa: '1.234' },
        'Informe um valor por pessoa válido',
      ],
      ['duração sem unidade', { duracao: '2' }, 'Informe a duração'],
      ['duração zero', { duracao: '0 horas' }, 'Informe a duração'],
      ['categoria de produto', { categoria: 'Produtos' }, 'Categoria deve ser'],
      ['título longo', { nome: 'x'.repeat(121) }, 'no máximo 120'],
      ['local longo', { local: 'x'.repeat(301) }, 'no máximo 300'],
    ])(
      '400 para %s, com orientação em português',
      async (_caso, fields, msg) => {
        const p = await registerProducer(t);

        const res = await post(p.auth, fields).expect(400);

        expect(JSON.stringify(res.body.message)).toContain(msg);
        expect(await experiences().countDocuments()).toBe(0);
      },
    );

    it('400 sem nenhuma foto', async () => {
      const p = await registerProducer(t);
      await post(p.auth, {}, { fotos: 0 }).expect(400);
      expect(await experiences().countDocuments()).toBe(0);
    });

    it('400 com mais de 10 fotos', async () => {
      const p = await registerProducer(t);
      await post(p.auth, {}, { fotos: 11 }).expect(400);
      expect(await experiences().countDocuments()).toBe(0);
    });

    it('415 para arquivo que não é imagem', async () => {
      const p = await registerProducer(t);
      let req = t.request().post(EXPERIENCES).set('Authorization', p.auth);
      for (const [k, v] of Object.entries(validExperience))
        req = req.field(k, v);
      await req
        .attach('fotos', Buffer.from('nao sou imagem'), 'foto.jpg')
        .expect(415);
      expect(await experiences().countDocuments()).toBe(0);
    });
  });

  describe('CA06: restrição de acesso', () => {
    it('401 para visitante', async () => {
      await post(undefined).expect(401);
    });

    it.each([Role.CONSUMIDOR, Role.ADMINISTRADOR])(
      '403 para %s',
      async (perfil) => {
        const token = await loginAs(t, perfil);
        await post(`Bearer ${token}`).expect(403);
        expect(await experiences().countDocuments()).toBe(0);
      },
    );

    it('404 para produtor desativado', async () => {
      const p = await registerProducer(t);
      await users()
        .updateOne({ _id: p.id }, { $set: { ativo: false } })
        .exec();
      // O token ainda é válido, mas a conta não pode ofertar.
      const res = await post(p.auth);
      expect([401, 404]).toContain(res.status);
      expect(await experiences().countDocuments()).toBe(0);
    });
  });

  describe('CA07: reenvio após falha de conexão', () => {
    it('mesma Idempotency-Key devolve a mesma experiência, sem duplicar', async () => {
      const p = await registerProducer(t);

      const first = await post(p.auth, {}, { key: 'chave-hu21-0001' }).expect(
        201,
      );
      const again = await post(p.auth, {}, { key: 'chave-hu21-0001' }).expect(
        201,
      );

      expect(again.body.id).toBe(first.body.id);
      expect(await experiences().countDocuments()).toBe(1);
    });

    it('400 para Idempotency-Key malformada', async () => {
      const p = await registerProducer(t);
      await post(p.auth, {}, { key: 'curta' }).expect(400);
    });
  });

  describe('CA08: identificação do responsável na apresentação pública', () => {
    it('lista e detalhe públicos, sem login, trazem só dados de divulgação do produtor', async () => {
      const p = await registerProducer(t, {
        nomeIniciativa: 'Sítio Boa Vista',
        localidade: 'Núcleo Rural Cafuringa',
      });
      await users()
        .updateOne({ _id: p.id }, { $set: { telefone: '61999990000' } })
        .exec();
      const created = await post(p.auth).expect(201);

      const list = await t.request().get(EXPERIENCES).expect(200);
      const detail = await t
        .request()
        .get(`${EXPERIENCES}/${created.body.id}`)
        .expect(200);

      expect(list.body).toMatchObject({ total: 1, pagina: 1 });
      expect(list.body.itens[0].id).toBe(created.body.id);
      expect(detail.body.produtor).toEqual({
        id: p.id,
        nomeIniciativa: 'Sítio Boa Vista',
        localidade: 'Núcleo Rural Cafuringa',
      });
      const body = JSON.stringify([list.body, detail.body]);
      for (const privado of [
        p.dto.email,
        p.dto.cpf,
        p.dto.nomeResponsavel,
        '61999990000',
        'chaveIdempotencia',
      ])
        expect(body).not.toContain(privado);
    });

    it('filtra pelo produtor (catálogo do perfil)', async () => {
      const a = await registerProducer(t);
      const b = await registerProducer(t);
      await post(a.auth).expect(201);
      await post(b.auth).expect(201);

      const res = await t
        .request()
        .get(EXPERIENCES)
        .query({ produtor: a.id })
        .expect(200);

      expect(res.body.total).toBe(1);
      expect(res.body.itens[0].produtor.id).toBe(a.id);
    });

    it('a foto pública é servida em WebP sem exigir login', async () => {
      const p = await registerProducer(t);
      const created = await post(p.auth).expect(201);

      const res = await t
        .request()
        .get(`/api/v1${created.body.fotos[0] as string}`)
        .expect(200);

      expect(res.headers['content-type']).toContain('image/webp');
    });

    it('indisponível ou de produtor desativado some da lista e do detalhe', async () => {
      const p = await registerProducer(t);
      const hidden = await post(p.auth).expect(201);
      await experiences()
        .updateOne({ _id: hidden.body.id }, { $set: { disponivel: false } })
        .exec();

      await t.request().get(`${EXPERIENCES}/${hidden.body.id}`).expect(404);
      expect((await t.request().get(EXPERIENCES).expect(200)).body.total).toBe(
        0,
      );

      const q = await registerProducer(t);
      const other = await post(q.auth).expect(201);
      await users()
        .updateOne({ _id: q.id }, { $set: { ativo: false } })
        .exec();
      await t.request().get(`${EXPERIENCES}/${other.body.id}`).expect(404);
    });

    it.each(['64b0c0ffee0000000000beef', 'nao-e-id'])(
      '404 em português para %s',
      async (id) => {
        const res = await t.request().get(`${EXPERIENCES}/${id}`).expect(404);
        expect(res.body.message).toBe('Experiência não encontrada');
      },
    );
  });
});
