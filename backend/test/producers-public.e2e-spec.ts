process.env.AUTH_THROTTLE_LIMIT = '1000';

import { makeProducer } from '@test/factories';
import { Types } from 'mongoose';
import { createTestApp, TestApp } from './utils/test-app.js';

const PRODUCERS = '/api/v1/producers';
const TRAJECTORY = `${PRODUCERS}/me/trajectory`;

describe('HU14 — consulta pública de produtores (e2e)', () => {
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

  async function producer({
    publish = true,
    telefone,
    telefonePublico = false,
  }: {
    publish?: boolean;
    telefone?: string;
    telefonePublico?: boolean;
  } = {}) {
    const dto = makeProducer(telefone ? { telefone } : {});
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
    const id = created.body.id as string;
    const auth = `Bearer ${login.body.accessToken as string}`;

    if (publish) {
      await t
        .request()
        .put(TRAJECTORY)
        .set('Authorization', auth)
        .send({
          trajetoria: 'Nossa história na região.',
          atividades: 'Horta e visitas guiadas.',
          telefonePublico,
        })
        .expect(200);
    }

    return { id, dto };
  }

  it('CA01/CA02/CA04/CA05: lista somente perfis publicados e ativos, sem dados privados', async () => {
    const authorized = await producer({
      telefone: '61988887777',
      telefonePublico: true,
    });
    const privateContact = await producer({
      telefone: '61999996666',
    });
    await producer({ publish: false });
    const inactive = await producer();
    await t.connection
      .collection('users')
      .updateOne(
        { _id: new Types.ObjectId(inactive.id) },
        { $set: { ativo: false } },
      );

    const response = await t.request().get(PRODUCERS).expect(200);

    expect(response.body).toHaveLength(2);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: authorized.id,
          nomeIniciativa: authorized.dto.nomeIniciativa,
          categoriaOfertada: authorized.dto.categoriaOfertada,
          trajetoria: 'Nossa história na região.',
          atividades: 'Horta e visitas guiadas.',
          telefone: '61988887777',
        }),
        expect.objectContaining({
          id: privateContact.id,
          trajetoria: 'Nossa história na região.',
          atividades: 'Horta e visitas guiadas.',
        }),
      ]),
    );

    const body = JSON.stringify(response.body);
    expect(body).not.toContain('61999996666');
    for (const { dto } of [authorized, privateContact]) {
      for (const secret of [
        dto.email,
        dto.cpf,
        dto.cnpj as string,
        dto.nomeResponsavel,
        dto.senha,
        'email',
        'cpf',
        'cnpj',
        'senhaHash',
        'cpfHash',
        'cpfCifrado',
        'cnpjHash',
        'cnpjCifrado',
      ]) {
        expect(body).not.toContain(secret);
      }
    }
  });

  it('CA01: responde lista vazia quando não há perfis públicos', async () => {
    await producer({ publish: false });

    await t.request().get(PRODUCERS).expect(200).expect([]);
  });
});
