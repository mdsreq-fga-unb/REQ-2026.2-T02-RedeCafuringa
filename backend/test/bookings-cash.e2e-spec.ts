process.env.AUTH_THROTTLE_LIMIT = '1000';
process.env.MAIL_RETRY_DELAYS_MS = '0';

import { MailService } from '../src/common/mail/mail.service.js';
import { Role } from '../src/modules/users/domain/role.js';
import { makeBooking } from './factories/booking.factory.js';
import { seedUser } from './utils/auth.js';
import { registerProducer, samplePhoto } from './utils/products.js';
import { createTestApp, TestApp } from './utils/test-app.js';

const BOOKINGS = '/api/v1/bookings';

describe('Pré-reserva sem sinal e pagamento no dia (e2e)', () => {
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

  /** A produtora cadastra pela API, escolhendo se exige sinal. */
  async function accepted(fields: Record<string, string> = {}) {
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
      ...fields,
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
      .send(
        makeBooking({
          experienciaId: experience.body.id as string,
          formaPagamento: 'dinheiro' as never,
        }),
      )
      .expect(201);
    const id = created.body.id as string;
    await t
      .request()
      .patch(`${BOOKINGS}/received/${id}/response`)
      .set('Authorization', producer.auth)
      .send({ status: 'aceita' })
      .expect(200);
    return { id, consumerAuth, producerAuth: producer.auth, experience };
  }

  const producerAction = (auth: string, id: string, action: string) =>
    t
      .request()
      .patch(`${BOOKINGS}/received/${id}/payment/${action}`)
      .set('Authorization', auth);

  it('a experiência mostra se exige sinal e as formas aceitas no dia', async () => {
    const { experience } = await accepted({
      exigeSinal: 'false',
      formasPagamentoNoDia: 'dinheiro,pix',
    });

    expect(experience.body).toMatchObject({
      exigeSinal: false,
      formasPagamentoNoDia: ['dinheiro', 'pix'],
    });
  });

  it('experiência sem sinal: o aceite já dispensa o sinal, e a produtora registra o pagamento no dia', async () => {
    const { id, consumerAuth, producerAuth } = await accepted({
      exigeSinal: 'false',
    });

    const detail = await t
      .request()
      .get(`${BOOKINGS}/${id}`)
      .set('Authorization', consumerAuth)
      .expect(200);
    expect(detail.body.pagamento.situacao).toBe('dispensado');
    expect(detail.body).not.toHaveProperty('pix');

    const res = await producerAction(producerAuth, id, 'received').expect(200);
    expect(res.body.situacao).toBe('pagamento-recebido');
  });

  it('quem não usa Pix: a produtora garante a vaga sem sinal', async () => {
    const { id, producerAuth } = await accepted();

    const res = await producerAction(producerAuth, id, 'waive').expect(200);
    expect(res.body.situacao).toBe('dispensado');
    await producerAction(producerAuth, id, 'waive').expect(409);
  });

  it('registrar o pagamento antes de resolver o sinal: 409', async () => {
    const { id, producerAuth } = await accepted();

    const res = await producerAction(producerAuth, id, 'received').expect(409);
    expect(res.body.message).toBe(
      'Confirme ou dispense o sinal antes de registrar o pagamento.',
    );
  });
});
