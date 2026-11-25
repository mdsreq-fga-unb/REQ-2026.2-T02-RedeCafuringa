process.env.AUTH_THROTTLE_LIMIT = '1000';
process.env.MAIL_RETRY_DELAYS_MS = '0';

import { MailService } from '../src/common/mail/mail.service.js';
import { Role } from '../src/modules/users/domain/role.js';
import { makeBooking } from './factories/booking.factory.js';
import { seedUser } from './utils/auth.js';
import { registerProducer, samplePhoto } from './utils/products.js';
import { createTestApp, TestApp } from './utils/test-app.js';

const BOOKINGS = '/api/v1/bookings';

describe('Notificações do sinal por Pix (e2e)', () => {
  let t: TestApp;
  let photo: Buffer;

  beforeAll(async () => {
    t = await createTestApp((builder) =>
      builder
        .overrideProvider(MailService)
        .useValue({ send: vi.fn().mockResolvedValue(undefined) }),
    );
    photo = await samplePhoto();
  });

  beforeEach(async () => {
    await t.clearDatabase();
  });

  afterAll(async () => {
    await t?.close();
  });

  async function accepted() {
    const producer = await registerProducer(t);
    let req = t
      .request()
      .post('/api/v1/experiences')
      .set('Authorization', producer.auth);
    for (const [name, value] of Object.entries({
      nome: 'Trilha',
      categoria: 'Experiência',
      descricao: 'Caminhada.',
      valorPorPessoa: '45.5',
      local: 'Sítio',
      duracao: '2 horas',
    }))
      req = req.field(name, value);
    const experience = await req.attach('fotos', photo, 'foto.jpg').expect(201);
    const consumer = await seedUser(t, Role.CONSUMIDOR, { nome: 'Ana' });
    const login = await t
      .request()
      .post('/api/v1/auth/login')
      .send({ email: consumer.email, senha: consumer.senha })
      .expect(200);
    const consumerAuth = `Bearer ${login.body.accessToken as string}`;
    const created = await t
      .request()
      .post(BOOKINGS)
      .set('Authorization', consumerAuth)
      .send(makeBooking({ experienciaId: experience.body.id as string }))
      .expect(201);
    const id = created.body.id as string;
    await t
      .request()
      .patch(`${BOOKINGS}/received/${id}/response`)
      .set('Authorization', producer.auth)
      .send({ status: 'aceita' })
      .expect(200);
    return { id, consumerAuth, producerAuth: producer.auth };
  }

  const notifications = async (auth: string) =>
    (
      await t
        .request()
        .get(`${BOOKINGS}/notifications`)
        .set('Authorization', auth)
        .expect(200)
    ).body as Array<{ id: string; pagamento?: string; devolucao?: string }>;

  it('o aceite avisa o sinal por pagar; o aviso de pagamento gera outra notificação', async () => {
    const { id, consumerAuth, producerAuth } = await accepted();

    const [first] = await notifications(consumerAuth);
    expect(first).toMatchObject({
      id: `${id}:aceita:aguardando-sinal`,
      pagamento: 'aguardando-sinal',
    });

    await t
      .request()
      .patch(`${BOOKINGS}/${id}/payment/sent`)
      .set('Authorization', consumerAuth)
      .expect(200);

    const [forProducer] = await notifications(producerAuth);
    expect(forProducer).toMatchObject({
      id: `${id}:aceita:comprovante-enviado`,
      pagamento: 'comprovante-enviado',
    });
  });

  it('cancelamento com sinal confirmado avisa a devolução, e o registro dela também', async () => {
    const { id, consumerAuth, producerAuth } = await accepted();
    await t
      .request()
      .patch(`${BOOKINGS}/received/${id}/payment/confirm`)
      .set('Authorization', producerAuth)
      .expect(200);
    await t
      .request()
      .patch(`${BOOKINGS}/${id}/cancel`)
      .set('Authorization', consumerAuth)
      .expect(200);

    expect((await notifications(producerAuth))[0]).toMatchObject({
      id: `${id}:cancelada:sinal-confirmado:pendente`,
      devolucao: 'pendente',
    });

    await t
      .request()
      .patch(`${BOOKINGS}/received/${id}/payment/refunded`)
      .set('Authorization', producerAuth)
      .expect(200);

    expect((await notifications(consumerAuth))[0]).toMatchObject({
      id: `${id}:cancelada:sinal-confirmado:feita`,
      devolucao: 'feita',
    });
  });
});
