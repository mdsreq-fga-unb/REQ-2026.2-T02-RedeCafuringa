process.env.AUTH_THROTTLE_LIMIT = '1000';
process.env.MAIL_RETRY_DELAYS_MS = '0';

import { getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { MailService } from '../src/common/mail/mail.service.js';
import { Booking } from '../src/modules/bookings/schemas/booking.schema.js';
import { ExperienceCategory } from '../src/modules/experiences/domain/experience.js';
import { Experience } from '../src/modules/experiences/schemas/experience.schema.js';
import { Role } from '../src/modules/users/domain/role.js';
import { makeBooking } from './factories/booking.factory.js';
import { makeProducer } from './factories/user.factory.js';
import { seedProducer, seedUser } from './utils/auth.js';
import { createTestApp, TestApp } from './utils/test-app.js';

const BOOKINGS = '/api/v1/bookings';

describe('Pré-reserva — aviso e confirmação do sinal (e2e)', () => {
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

  const bookings = () => t.app.get<Model<Booking>>(getModelToken(Booking.name));
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

  async function producer() {
    const dto = makeProducer();
    const { user } = await seedProducer(t, dto);
    return { id: user._id, auth: await login(dto.email, dto.senha) };
  }

  async function consumer() {
    const { email, senha } = await seedUser(t, Role.CONSUMIDOR, {
      nome: 'Ana',
    });
    return login(email, senha);
  }

  /** Pré-reserva aceita, com o sinal por pagar. */
  async function accepted() {
    const owner = await producer();
    const experience = await experiences().create({
      produtor: owner.id,
      nome: 'Trilha',
      categoria: ExperienceCategory.EXPERIENCIA,
      descricao: 'Caminhada.',
      valorCentavos: 4550,
      local: 'Sítio',
      duracao: '2 horas',
      fotos: [],
    });
    const consumerAuth = await consumer();
    const created = await t
      .request()
      .post(BOOKINGS)
      .set('Authorization', consumerAuth)
      .send(makeBooking({ experienciaId: experience._id.toHexString() }))
      .expect(201);
    const id = created.body.id as string;
    await t
      .request()
      .patch(`${BOOKINGS}/received/${id}/response`)
      .set('Authorization', owner.auth)
      .send({ status: 'aceita' })
      .expect(200);
    return { id, consumerAuth, producerAuth: owner.auth };
  }

  const sent = (auth: string, id: string) =>
    t
      .request()
      .patch(`${BOOKINGS}/${id}/payment/sent`)
      .set('Authorization', auth);
  const confirm = (auth: string, id: string) =>
    t
      .request()
      .patch(`${BOOKINGS}/received/${id}/payment/confirm`)
      .set('Authorization', auth);
  const notFound = (auth: string, id: string) =>
    t
      .request()
      .patch(`${BOOKINGS}/received/${id}/payment/not-found`)
      .set('Authorization', auth);
  const situacao = async (auth: string, id: string) =>
    (
      await t
        .request()
        .get(`${BOOKINGS}/${id}`)
        .set('Authorization', auth)
        .expect(200)
    ).body.pagamento.situacao as string;

  it('aviso, contestação, novo aviso e confirmação', async () => {
    const { id, consumerAuth, producerAuth } = await accepted();

    expect((await sent(consumerAuth, id).expect(200)).body.situacao).toBe(
      'comprovante-enviado',
    );
    expect((await notFound(producerAuth, id).expect(200)).body.situacao).toBe(
      'aguardando-sinal',
    );
    await sent(consumerAuth, id).expect(200);
    expect((await confirm(producerAuth, id).expect(200)).body.situacao).toBe(
      'sinal-confirmado',
    );
    expect(await situacao(consumerAuth, id)).toBe('sinal-confirmado');
  });

  it('a produtora confirma mesmo sem o aviso da consumidora', async () => {
    const { id, producerAuth } = await accepted();

    expect((await confirm(producerAuth, id).expect(200)).body.situacao).toBe(
      'sinal-confirmado',
    );
  });

  it('depois do prazo, a consumidora não avisa, mas a produtora ainda confirma', async () => {
    const { id, consumerAuth, producerAuth } = await accepted();
    await bookings().updateOne(
      { _id: id },
      { $set: { 'pagamento.prazoSinal': new Date(Date.now() - 1000) } },
    );

    const res = await sent(consumerAuth, id).expect(409);
    expect(res.body.message).toBe(
      'O prazo para pagar o sinal terminou. Fale com a produtora.',
    );
    await confirm(producerAuth, id).expect(200);
  });

  it('quem não é dona nem responsável não mexe no pagamento', async () => {
    const { id } = await accepted();
    const otherConsumer = await consumer();
    const otherProducer = await producer();

    await sent(otherConsumer, id).expect(404);
    await confirm(otherProducer.auth, id).expect(403);
    await notFound(otherProducer.auth, id).expect(403);
  });

  it('perfil errado: 403 do controle de acesso', async () => {
    const { id, consumerAuth, producerAuth } = await accepted();

    await sent(producerAuth, id).expect(403);
    await confirm(consumerAuth, id).expect(403);
  });

  it('contestar sem aviso: 409 com o motivo', async () => {
    const { id, producerAuth } = await accepted();

    const res = await notFound(producerAuth, id).expect(409);
    expect(res.body.message).toBe(
      'A consumidora ainda não avisou que pagou o sinal.',
    );
  });
});
