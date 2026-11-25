process.env.AUTH_THROTTLE_LIMIT = '1000';
process.env.MAIL_RETRY_DELAYS_MS = '0';

import { getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { MailService } from '../src/common/mail/mail.service.js';
import { ExperienceCategory } from '../src/modules/experiences/domain/experience.js';
import { Experience } from '../src/modules/experiences/schemas/experience.schema.js';
import { Role } from '../src/modules/users/domain/role.js';
import { futureBookingDate, makeBooking } from './factories/booking.factory.js';
import { makeProducer } from './factories/user.factory.js';
import { seedProducer, seedUser } from './utils/auth.js';
import { createTestApp, TestApp } from './utils/test-app.js';

const BOOKINGS = '/api/v1/bookings';

describe('Cancelamento com sinal por Pix (e2e)', () => {
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

  /** Pré-reserva aceita para daqui a `dias` dias, com o sinal confirmado. */
  async function paidBooking(dias = 30) {
    const producerDto = makeProducer();
    const { user } = await seedProducer(t, producerDto);
    const producerAuth = await login(producerDto.email, producerDto.senha);
    const experience = await experiences().create({
      produtor: user._id,
      nome: 'Trilha',
      categoria: ExperienceCategory.EXPERIENCIA,
      descricao: 'Caminhada.',
      valorCentavos: 4550,
      local: 'Sítio',
      duracao: '2 horas',
      fotos: [],
    });
    const consumer = await seedUser(t, Role.CONSUMIDOR, { nome: 'Ana' });
    const consumerAuth = await login(consumer.email, consumer.senha);
    const created = await t
      .request()
      .post(BOOKINGS)
      .set('Authorization', consumerAuth)
      .send(
        makeBooking({
          experienciaId: experience._id.toHexString(),
          data: futureBookingDate(dias),
        }),
      )
      .expect(201);
    const id = created.body.id as string;
    await t
      .request()
      .patch(`${BOOKINGS}/received/${id}/response`)
      .set('Authorization', producerAuth)
      .send({ status: 'aceita' })
      .expect(200);
    await t
      .request()
      .patch(`${BOOKINGS}/received/${id}/payment/confirm`)
      .set('Authorization', producerAuth)
      .expect(200);
    return { id, consumerAuth, producerAuth };
  }

  const detail = async (auth: string, id: string) =>
    (
      await t
        .request()
        .get(`${BOOKINGS}/${id}`)
        .set('Authorization', auth)
        .expect(200)
    ).body as { status: string; pagamento: { devolucao?: string } };

  it('consumidora cancela com antecedência: a produtora deve devolver o sinal e registra a devolução', async () => {
    const { id, consumerAuth, producerAuth } = await paidBooking(30);

    const res = await t
      .request()
      .patch(`${BOOKINGS}/${id}/cancel`)
      .set('Authorization', consumerAuth)
      .expect(200);

    expect(res.body).toMatchObject({
      status: 'cancelada',
      sinal: { resultado: 'devolver', valor: 91 },
    });
    expect((await detail(producerAuth, id)).pagamento.devolucao).toBe(
      'pendente',
    );

    const refunded = await t
      .request()
      .patch(`${BOOKINGS}/received/${id}/payment/refunded`)
      .set('Authorization', producerAuth)
      .expect(200);
    expect(refunded.body.devolucao).toBe('feita');
    expect((await detail(consumerAuth, id)).pagamento.devolucao).toBe('feita');

    await t
      .request()
      .patch(`${BOOKINGS}/received/${id}/payment/refunded`)
      .set('Authorization', producerAuth)
      .expect(409);
  });

  it('consumidora cancela em cima da hora: o sinal fica com a produtora', async () => {
    const { id, consumerAuth } = await paidBooking(1);

    const res = await t
      .request()
      .patch(`${BOOKINGS}/${id}/cancel`)
      .set('Authorization', consumerAuth)
      .expect(200);

    expect(res.body.sinal).toEqual({ resultado: 'retido', valor: 91 });
    expect((await detail(consumerAuth, id)).pagamento.devolucao).toBe('retido');
  });

  it('produtora cancela: sempre devolve o sinal', async () => {
    const { id, consumerAuth, producerAuth } = await paidBooking(1);

    const res = await t
      .request()
      .patch(`${BOOKINGS}/received/${id}/cancel`)
      .set('Authorization', producerAuth)
      .expect(200);

    expect(res.body).toMatchObject({
      status: 'cancelada',
      sinal: { resultado: 'devolver', valor: 91 },
    });
    expect((await detail(consumerAuth, id)).status).toBe('cancelada');
  });

  it('a consumidora não usa a rota da produtora, e vice-versa', async () => {
    const { id, consumerAuth, producerAuth } = await paidBooking(30);

    await t
      .request()
      .patch(`${BOOKINGS}/received/${id}/cancel`)
      .set('Authorization', consumerAuth)
      .expect(403);
    await t
      .request()
      .patch(`${BOOKINGS}/${id}/cancel`)
      .set('Authorization', producerAuth)
      .expect(403);
  });
});
