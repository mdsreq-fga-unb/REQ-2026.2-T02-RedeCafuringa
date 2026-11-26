process.env.AUTH_THROTTLE_LIMIT = '1000';
process.env.MAIL_RETRY_DELAYS_MS = '0';

import { getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { MailService } from '../src/common/mail/mail.service.js';
import { ExperienceCategory } from '../src/modules/experiences/domain/experience.js';
import { Experience } from '../src/modules/experiences/schemas/experience.schema.js';
import { Role } from '../src/modules/users/domain/role.js';
import { User } from '../src/modules/users/schemas/user.schema.js';
import { makeBooking } from './factories/booking.factory.js';
import { makeProducer } from './factories/user.factory.js';
import { seedProducer, seedUser } from './utils/auth.js';
import { createTestApp, TestApp } from './utils/test-app.js';

const BOOKINGS = '/api/v1/bookings';

describe('Pré-reserva — sinal por Pix no aceite (e2e)', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp((builder) =>
      builder
        .overrideProvider(MailService)
        .useValue({ send: vi.fn().mockResolvedValue(undefined) }),
    );
  });

  beforeEach(async () => {
    await t.clearDatabase();
  });

  afterAll(async () => {
    await t?.close();
  });

  const users = () => t.app.get<Model<User>>(getModelToken(User.name));
  const experiences = () =>
    t.app.get<Model<Experience>>(getModelToken(Experience.name));

  async function login(email: string, senha: string) {
    const res = await t
      .request()
      .post('/api/v1/auth/login')
      .send({ email, senha })
      .expect(200);
    return `Bearer ${res.body.accessToken as string}`;
  }

  /** Produtora com experiência de R$ 45,50 e, se pedido, chave Pix autorizada. */
  async function scenario(
    pix: { pixPublico: boolean } | null = { pixPublico: true },
    valorCentavos = 4550,
  ) {
    const producerDto = makeProducer({ nomeIniciativa: 'Sítio Boa Vista' });
    const { user: producer } = await seedProducer(t, producerDto);
    if (pix)
      await users().updateOne(
        { _id: producer._id },
        {
          $set: {
            pixTipo: 'telefone',
            pixChave: '+5561999998888',
            pixRecebedor: 'Maria da Silva',
            ...pix,
          },
        },
      );
    const experience = await experiences().create({
      produtor: producer._id,
      nome: 'Visita e Degustação de Queijos',
      categoria: ExperienceCategory.EXPERIENCIA,
      descricao: 'Conheça a produção artesanal de queijos.',
      valorCentavos,
      local: 'Sítio Boa Vista',
      duracao: '2 horas',
      fotos: [],
    });
    const consumer = await seedUser(t, Role.CONSUMIDOR, { nome: 'Ana' });
    const consumerAuth = await login(consumer.email, consumer.senha);
    const producerAuth = await login(producerDto.email, producerDto.senha);
    const booking = await t
      .request()
      .post(BOOKINGS)
      .set('Authorization', consumerAuth)
      .send(
        makeBooking({
          experienciaId: experience._id.toHexString(),
          participantes: 4,
        }),
      )
      .expect(201);
    const id = booking.body.id as string;
    return { id, consumerAuth, producerAuth };
  }

  const respond = (auth: string, id: string, status: string) =>
    t
      .request()
      .patch(`${BOOKINGS}/received/${id}/response`)
      .set('Authorization', auth)
      .send({ status })
      .expect(200);

  const detail = (auth: string, id: string) =>
    t.request().get(`${BOOKINGS}/${id}`).set('Authorization', auth).expect(200);

  it('no aceite, a consumidora vê o sinal de 50%, o prazo e o Pix da produtora', async () => {
    const { id, consumerAuth, producerAuth } = await scenario();
    const before = Date.now();

    await respond(producerAuth, id, 'aceita');
    const res = await detail(consumerAuth, id);

    expect(res.body.pagamento).toMatchObject({
      total: 182,
      sinal: 91,
      restante: 91,
      situacao: 'aguardando-sinal',
    });
    const prazo = new Date(res.body.pagamento.prazoSinal as string).getTime();
    expect(prazo - before).toBeGreaterThanOrEqual(24 * 60 * 60 * 1000 - 5000);
    expect(prazo - before).toBeLessThanOrEqual(24 * 60 * 60 * 1000 + 5000);
    expect(res.body.pix).toEqual({
      chave: '+5561999998888',
      nomeRecebedor: 'Maria da Silva',
      cidade: 'BRASILIA',
      txid: id,
    });
  });

  it('a produtora vê o pagamento, sem a própria chave no detalhe', async () => {
    const { id, producerAuth } = await scenario();

    await respond(producerAuth, id, 'aceita');
    const res = await detail(producerAuth, id);

    expect(res.body.pagamento.sinal).toBe(91);
    expect(res.body).not.toHaveProperty('pix');
  });

  it('sem autorização da produtora, a consumidora não recebe a chave', async () => {
    const { id, consumerAuth, producerAuth } = await scenario({
      pixPublico: false,
    });

    await respond(producerAuth, id, 'aceita');
    const res = await detail(consumerAuth, id);

    expect(res.body.pagamento.situacao).toBe('aguardando-sinal');
    expect(JSON.stringify(res.body)).not.toContain('5561999998888');
  });

  it('experiência gratuita: o sinal fica dispensado', async () => {
    const { id, consumerAuth, producerAuth } = await scenario(
      { pixPublico: true },
      0,
    );

    await respond(producerAuth, id, 'aceita');
    const res = await detail(consumerAuth, id);

    expect(res.body.pagamento).toEqual({
      total: 0,
      sinal: 0,
      restante: 0,
      situacao: 'dispensado',
    });
    expect(res.body).not.toHaveProperty('pix');
  });

  it('pendente e recusada não têm pagamento', async () => {
    const { id, consumerAuth, producerAuth } = await scenario();

    expect((await detail(consumerAuth, id)).body).not.toHaveProperty(
      'pagamento',
    );
    await respond(producerAuth, id, 'recusada');
    expect((await detail(consumerAuth, id)).body).not.toHaveProperty(
      'pagamento',
    );
  });
});
