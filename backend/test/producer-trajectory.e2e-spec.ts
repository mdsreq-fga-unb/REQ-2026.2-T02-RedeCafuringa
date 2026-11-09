process.env.AUTH_THROTTLE_LIMIT = '1000';

import { makeProducer } from '@test/factories';
import { Types } from 'mongoose';
import { Role } from '../src/modules/users/domain/role.js';
import { forgeToken, loginAs, seedUser } from './utils/auth.js';
import { createTestApp, TestApp } from './utils/test-app.js';

const ME = '/api/v1/producers/me/trajectory';
const publicUrl = (id: string) => `/api/v1/producers/${id}/trajectory`;

const TRAJETORIA = 'Começamos a plantar café em 1990, no Núcleo Rural.';
const ATIVIDADES = 'Horta orgânica e visitas guiadas.';

describe('HU12 — Registrar trajetória do produtor (e2e)', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(async () => {
    await t.clearDatabase();
  });

  afterAll(async () => {
    await t?.close();
  });

  /** Cadastra um produtor pela API pública (HU02) e entra com ele. */
  async function producer(overrides: Parameters<typeof makeProducer>[0] = {}) {
    const dto = makeProducer(overrides);
    const created = await t
      .request()
      .post('/api/v1/users/producers')
      .send(dto)
      .expect(201);
    const login = await t
      .request()
      .post('/api/v1/auth/login')
      .send({ email: dto.email, senha: dto.senha })
      .expect(200);

    return {
      id: created.body.id as string,
      dto,
      auth: `Bearer ${login.body.accessToken as string}`,
    };
  }

  const save = (auth: string, body: Record<string, unknown>) =>
    t.request().put(ME).set('Authorization', auth).send(body);

  describe('CA01/CA02 — acesso e preenchimento', () => {
    it('CA01: produtor sem trajetória vê o estado inicial', async () => {
      const { auth, dto } = await producer({ telefone: '61999990000' });

      const response = await t
        .request()
        .get(ME)
        .set('Authorization', auth)
        .expect(200);

      expect(response.body).toEqual({
        telefone: dto.telefone,
        telefonePublico: false,
      });
    });

    it('CA02: permite preencher trajetória, atividades, telefone e visibilidade', async () => {
      const { auth } = await producer();

      const response = await save(auth, {
        trajetoria: TRAJETORIA,
        atividades: ATIVIDADES,
        telefone: '61988887777',
        telefonePublico: true,
      }).expect(200);

      expect(response.body).toMatchObject({
        trajetoria: TRAJETORIA,
        atividades: ATIVIDADES,
        telefone: '61988887777',
        telefonePublico: true,
      });
      expect(response.body.atualizadoEm).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('CA03 — validação (RNF03)', () => {
    it.each([
      ['sem trajetória', {}, 'Trajetória é obrigatória'],
      ['trajetória vazia', { trajetoria: '   ' }, 'Trajetória é obrigatória'],
      [
        'trajetória enorme',
        { trajetoria: 'a'.repeat(2001) },
        'Trajetória deve ter no máximo 2000 caracteres',
      ],
      [
        'atividades enormes',
        { trajetoria: 'x', atividades: 'a'.repeat(2001) },
        'Atividades deve ter no máximo 2000 caracteres',
      ],
      [
        'telefone com máscara',
        { trajetoria: 'x', telefone: '(61) 99999-0000' },
        'Telefone deve ter DDD e número, apenas dígitos (10 ou 11)',
      ],
      [
        'visibilidade não booleana',
        { trajetoria: 'x', telefonePublico: 'sim' },
        'telefonePublico deve ser verdadeiro ou falso',
      ],
    ])('%s: 400 com mensagem orientativa', async (_nome, body, message) => {
      const { auth } = await producer();

      const response = await save(auth, body).expect(400);

      expect(response.body.message).toContain(message);
    });

    it('dados inválidos não gravam nada', async () => {
      const { auth } = await producer();
      await save(auth, { trajetoria: TRAJETORIA }).expect(200);

      await save(auth, { trajetoria: '' }).expect(400);

      const atual = await t.request().get(ME).set('Authorization', auth);
      expect(atual.body.trajetoria).toBe(TRAJETORIA);
    });

    it('corpo com objeto de operador no lugar do texto é recusado', async () => {
      const { auth } = await producer();

      await save(auth, { trajetoria: { $ne: null } }).expect(400);
      await save(auth, {
        trajetoria: 'x',
        atividades: { $set: { a: 1 } },
      }).expect(400);
    });

    it('aceita exatamente 2000 caracteres', async () => {
      const { auth } = await producer();

      await save(auth, { trajetoria: 'a'.repeat(2000) }).expect(200);
    });

    it('normaliza o texto: sem espaços nas pontas nem caracteres de controle', async () => {
      const { auth } = await producer();

      const response = await save(auth, {
        trajetoria: '  linha 1\r\nlinha 2\u0000  ',
      }).expect(200);

      expect(response.body.trajetoria).toBe('linha 1\nlinha 2');
    });
  });

  describe('CA04 — salvamento e associação ao perfil', () => {
    it('grava na conta do produtor autenticado, e só nela', async () => {
      const a = await producer();
      const b = await producer();

      await save(a.auth, { trajetoria: 'História de A' }).expect(200);

      const doB = await t.request().get(ME).set('Authorization', b.auth);
      expect(doB.body.trajetoria).toBeUndefined();
      const doA = await t.request().get(ME).set('Authorization', a.auth);
      expect(doA.body.trajetoria).toBe('História de A');
    });

    it('o dono é o do token: id ou e-mail no corpo são recusados', async () => {
      const a = await producer();
      const b = await producer();

      await save(a.auth, { trajetoria: 'x', id: b.id, userId: b.id }).expect(
        400,
      );
      await save(a.auth, { trajetoria: 'x', email: b.dto.email }).expect(400);

      const doB = await t.request().get(ME).set('Authorization', b.auth);
      expect(doB.body.trajetoria).toBeUndefined();
    });

    it('não permite elevar o perfil nem trocar dados da conta (mass assignment)', async () => {
      const { auth, id, dto } = await producer();

      await save(auth, { trajetoria: 'x', perfil: Role.ADMINISTRADOR }).expect(
        400,
      );
      await save(auth, {
        trajetoria: 'x',
        senhaHash: 'hack',
        ativo: false,
      }).expect(400);

      const stored = await t.connection
        .collection('users')
        .findOne({ email: dto.email.toLowerCase() });
      expect(stored?.perfil).toBe(Role.PRODUTOR);
      expect(stored?.ativo).toBe(true);
      expect(String(stored?._id)).toBe(id);
    });

    it('salvar não altera os demais dados cadastrais', async () => {
      const { auth, dto } = await producer({ telefone: '61999990000' });
      const before = await t.connection
        .collection('users')
        .findOne({ email: dto.email.toLowerCase() });

      await save(auth, {
        trajetoria: TRAJETORIA,
        atividades: ATIVIDADES,
      }).expect(200);

      const after = await t.connection
        .collection('users')
        .findOne({ email: dto.email.toLowerCase() });
      for (const campo of [
        'nomeIniciativa',
        'nomeResponsavel',
        'email',
        'cpfHash',
        'cpfCifrado',
        'senhaHash',
        'localidade',
        'categoriaOfertada',
        'telefone',
        'perfil',
      ]) {
        expect(after?.[campo], campo).toEqual(before?.[campo]);
      }
    });

    it('omitir telefone e visibilidade preserva o que já estava', async () => {
      const { auth } = await producer({ telefone: '61999990000' });
      await save(auth, { trajetoria: 'x', telefonePublico: true }).expect(200);

      const response = await save(auth, { trajetoria: 'y' }).expect(200);

      expect(response.body.telefone).toBe('61999990000');
      expect(response.body.telefonePublico).toBe(true);
    });

    it('telefone null remove o telefone e o torna privado', async () => {
      const { auth, id } = await producer({ telefone: '61999990000' });
      await save(auth, { trajetoria: 'x', telefonePublico: true }).expect(200);

      const response = await save(auth, {
        trajetoria: 'x',
        telefone: null,
        telefonePublico: true,
      }).expect(200);

      expect(response.body.telefone).toBeUndefined();
      expect(response.body.telefonePublico).toBe(false);
      const atual = await t.request().get(ME).set('Authorization', auth);
      expect(atual.body.telefone).toBeUndefined();
      const publico = await t.request().get(publicUrl(id)).expect(200);
      expect(publico.body.telefone).toBeUndefined();
      const doc = await t.connection
        .collection('users')
        .findOne({ _id: new Types.ObjectId(id) });
      expect(doc).not.toHaveProperty('telefone');
    });

    it('telefone de outro tipo continua recusado e não apaga o cadastrado', async () => {
      const { auth } = await producer({ telefone: '61999990000' });

      await save(auth, { trajetoria: 'x', telefone: 61999990000 }).expect(400);

      const atual = await t.request().get(ME).set('Authorization', auth);
      expect(atual.body.telefone).toBe('61999990000');
    });

    it('trajetória só com caracteres invisíveis é recusada (não publica perfil em branco)', async () => {
      const { auth } = await producer();

      const response = await save(auth, {
        trajetoria: String.fromCodePoint(0x200b, 0xfeff),
      }).expect(400);

      expect(response.body.message).toContain('Trajetória é obrigatória');
    });

    it('inversões bidirecionais são removidas antes de gravar (sem texto falsificado no perfil)', async () => {
      const { auth, id } = await producer();
      const rlo = String.fromCodePoint(0x202e);

      await save(auth, { trajetoria: `Ligue ${rlo}0000-99999` }).expect(200);

      const publico = await t.request().get(publicUrl(id)).expect(200);
      expect(publico.body.trajetoria).toBe('Ligue 0000-99999');
    });

    it('omitir atividades apaga as anteriores (PUT substitui o registro)', async () => {
      const { auth } = await producer();
      await save(auth, { trajetoria: 'x', atividades: ATIVIDADES }).expect(200);

      const response = await save(auth, { trajetoria: 'x' }).expect(200);

      expect(response.body.atividades).toBeUndefined();
    });

    it('CA07: reenviar o mesmo conteúdo grava o mesmo conteúdo (idempotente no conteúdo; só atualizadoEm avança)', async () => {
      const { auth, id } = await producer();
      const body = { trajetoria: TRAJETORIA, atividades: ATIVIDADES };

      const first = await save(auth, body).expect(200);
      const second = await save(auth, body).expect(200);

      const { atualizadoEm: firstAt, ...restFirst } = first.body;
      const { atualizadoEm: secondAt, ...restSecond } = second.body;
      expect(restSecond).toEqual(restFirst);
      expect(Date.parse(secondAt as string)).toBeGreaterThanOrEqual(
        Date.parse(firstAt as string),
      );
      expect(
        await t.connection
          .collection('users')
          .countDocuments({ perfil: Role.PRODUTOR }),
      ).toBe(1);
      expect((await t.request().get(publicUrl(id))).body.trajetoria).toBe(
        TRAJETORIA,
      );
    });
  });

  describe('CA05 — apresentação no perfil público (RN07, RNF11)', () => {
    it('visitante sem login vê a trajetória publicada', async () => {
      const { auth, id, dto } = await producer();
      await save(auth, {
        trajetoria: TRAJETORIA,
        atividades: ATIVIDADES,
      }).expect(200);

      const response = await t.request().get(publicUrl(id)).expect(200);

      expect(response.body).toEqual({
        id,
        nomeIniciativa: dto.nomeIniciativa,
        categoriaOfertada: dto.categoriaOfertada,
        trajetoria: TRAJETORIA,
        atividades: ATIVIDADES,
      });
    });

    it('consumidor logado também vê', async () => {
      const { auth, id } = await producer();
      await save(auth, { trajetoria: TRAJETORIA }).expect(200);
      const consumidor = await loginAs(t, Role.CONSUMIDOR);

      await t
        .request()
        .get(publicUrl(id))
        .set('Authorization', `Bearer ${consumidor}`)
        .expect(200);
    });

    it('produtor que ainda não publicou a trajetória: 404 (perfil oculto)', async () => {
      const { id } = await producer({ telefone: '61999990000' });

      const response = await t.request().get(publicUrl(id)).expect(404);

      expect(JSON.stringify(response.body)).not.toContain('61999990000');
    });

    it('telefone fica oculto por padrão, mesmo cadastrado', async () => {
      const { auth, id, dto } = await producer({ telefone: '61999990000' });
      await save(auth, { trajetoria: TRAJETORIA }).expect(200);

      const response = await t.request().get(publicUrl(id)).expect(200);

      expect(response.body.telefone).toBeUndefined();
      expect(JSON.stringify(response.body)).not.toContain(
        dto.telefone as string,
      );
    });

    it('telefone aparece quando o produtor autoriza e some quando revoga', async () => {
      const { auth, id } = await producer({ telefone: '61999990000' });
      await save(auth, { trajetoria: 'x', telefonePublico: true }).expect(200);
      expect((await t.request().get(publicUrl(id))).body.telefone).toBe(
        '61999990000',
      );

      await save(auth, { trajetoria: 'x', telefonePublico: false }).expect(200);

      expect(
        (await t.request().get(publicUrl(id))).body.telefone,
      ).toBeUndefined();
    });

    it('RNF11: nunca expõe e-mail, CPF, CNPJ, nome do responsável, senha ou hashes', async () => {
      const { auth, id, dto } = await producer({ telefone: '61999990000' });
      await save(auth, {
        trajetoria: TRAJETORIA,
        atividades: ATIVIDADES,
        telefonePublico: true,
      }).expect(200);

      const body = JSON.stringify((await t.request().get(publicUrl(id))).body);

      for (const secret of [
        dto.email,
        dto.nomeResponsavel,
        dto.cpf,
        dto.cnpj as string,
        dto.senha,
        'senhaHash',
        'cpfHash',
        'cpfCifrado',
        'cnpj',
        '$argon2',
        dto.localidade,
        'perfil',
        'ativo',
      ]) {
        expect(body, secret).not.toContain(secret);
      }
    });

    it('a resposta própria também não vaza e-mail, CPF ou hashes', async () => {
      const { auth, dto } = await producer();
      await save(auth, { trajetoria: TRAJETORIA }).expect(200);

      const body = JSON.stringify(
        (await t.request().get(ME).set('Authorization', auth)).body,
      );

      for (const secret of [
        dto.email,
        dto.cpf,
        'senhaHash',
        'cpfHash',
        '$argon2',
      ]) {
        expect(body, secret).not.toContain(secret);
      }
    });

    it('texto com HTML é devolvido como texto (quem exibe é que escapa)', async () => {
      const { auth, id } = await producer();
      const xss = '<script>alert(1)</script> & "aspas"';
      await save(auth, { trajetoria: xss }).expect(200);

      const response = await t.request().get(publicUrl(id)).expect(200);

      expect(response.body.trajetoria).toBe(xss);
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it.each([
      ['id inexistente', '64b0c0ffee0000000000abcd'],
      ['id malformado', 'nao-e-um-id'],
      ['id de operador', '%7B%22%24ne%22%3Anull%7D'],
      ['id curto', '123'],
    ])('%s: 404', async (_nome, id) => {
      await t.request().get(publicUrl(id)).expect(404);
    });

    it('conta de consumidor ou administrador não é um perfil de produtor: 404', async () => {
      const consumidor = await seedUser(t, Role.CONSUMIDOR);
      const admin = await seedUser(t, Role.ADMINISTRADOR);

      await t
        .request()
        .get(publicUrl(String(consumidor.user._id)))
        .expect(404);
      await t
        .request()
        .get(publicUrl(String(admin.user._id)))
        .expect(404);
    });

    it('produtor desativado some do perfil público', async () => {
      const { auth, id } = await producer();
      await save(auth, { trajetoria: TRAJETORIA }).expect(200);
      await t.connection.collection('users').updateOne(
        { email: { $exists: true }, perfil: Role.PRODUTOR },
        {
          $set: { ativo: false },
        },
      );

      await t.request().get(publicUrl(id)).expect(404);
    });
  });

  describe('CA06 — restrição de acesso à edição (RN01, RNF08)', () => {
    it('sem login: 401 para consultar e para salvar', async () => {
      await t.request().get(ME).expect(401);
      await t.request().put(ME).send({ trajetoria: 'x' }).expect(401);
    });

    it('token inválido, expirado ou com outro segredo: 401', async () => {
      const { id } = await producer();
      for (const token of [
        'lixo',
        forgeToken({ sub: id, perfil: 'PRODUTOR' }, { expiresIn: -60 }),
        forgeToken({ sub: id, perfil: 'PRODUTOR' }, { secret: 'x'.repeat(40) }),
        forgeToken({ sub: id, perfil: 'PRODUTOR' }, { alg: 'none' }),
      ]) {
        await t
          .request()
          .put(ME)
          .set('Authorization', `Bearer ${token}`)
          .send({ trajetoria: 'x' })
          .expect(401);
      }
    });

    it.each([Role.CONSUMIDOR, Role.ADMINISTRADOR])(
      '%s: 403 ao consultar e ao tentar registrar',
      async (perfil) => {
        const token = await loginAs(t, perfil);
        const auth = `Bearer ${token}`;

        await t.request().get(ME).set('Authorization', auth).expect(403);
        await save(auth, { trajetoria: 'x' }).expect(403);
      },
    );

    it('outro produtor não consegue alterar a trajetória de terceiros', async () => {
      const a = await producer();
      const b = await producer();
      await save(a.auth, { trajetoria: 'História de A' }).expect(200);

      // Não existe rota para escrever na conta alheia: tentativas por id não existem.
      await t
        .request()
        .put(`/api/v1/producers/${a.id}/trajectory`)
        .set('Authorization', b.auth)
        .send({ trajetoria: 'invadido' })
        .expect(404);

      expect((await t.request().get(publicUrl(a.id))).body.trajetoria).toBe(
        'História de A',
      );
    });

    it('token de conta desativada deixa de gravar', async () => {
      const { auth, dto } = await producer();
      await t.connection
        .collection('users')
        .updateMany({ perfil: Role.PRODUTOR }, { $set: { ativo: false } });

      const response = await save(auth, { trajetoria: 'x' });

      expect(response.status).toBe(401);
      const stored = await t.connection
        .collection('users')
        .findOne({ email: dto.email.toLowerCase() });
      expect(stored?.trajetoria).toBeUndefined();
    });

    it('usuário removido com token ainda válido não grava nada', async () => {
      const { auth } = await producer();
      await t.connection.collection('users').deleteMany({});

      const response = await save(auth, { trajetoria: 'x' });

      expect(response.status).toBe(401);
      expect(await t.connection.collection('users').countDocuments()).toBe(0);
    });
  });

  describe('CA07 — falha durante o registro', () => {
    it('corpo malformado devolve 400 e preserva o que já estava gravado', async () => {
      const { auth } = await producer();
      await save(auth, { trajetoria: TRAJETORIA }).expect(200);

      await t
        .request()
        .put(ME)
        .set('Authorization', auth)
        .set('Content-Type', 'application/json')
        .send('{"trajetoria": "x"')
        .expect(400);

      const atual = await t.request().get(ME).set('Authorization', auth);
      expect(atual.body.trajetoria).toBe(TRAJETORIA);
    });

    it('corpo acima do limite do servidor é recusado com 413, antes da validação, sem gravar', async () => {
      const { auth } = await producer();

      const response = await save(auth, { trajetoria: 'a'.repeat(300_000) });

      // 413 (e não 400) prova que o limite de corpo do servidor barrou antes do DTO.
      expect(response.status).toBe(413);
      const atual = await t.request().get(ME).set('Authorization', auth);
      expect(atual.body.trajetoria).toBeUndefined();
    });
  });
});
