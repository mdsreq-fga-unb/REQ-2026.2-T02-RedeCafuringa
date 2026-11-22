process.env.AUTH_THROTTLE_LIMIT = '1000';
process.env.MAIL_RETRY_DELAYS_MS = '0';

import { getModelToken } from '@nestjs/mongoose';
import { MailService } from '../src/common/mail/mail.service.js';
import { BookingStatus } from '../src/modules/bookings/domain/booking.js';
import { Booking } from '../src/modules/bookings/schemas/booking.schema.js';
import { ExperienceCategory } from '../src/modules/experiences/domain/experience.js';
import { Experience } from '../src/modules/experiences/schemas/experience.schema.js';
import { Role } from '../src/modules/users/domain/role.js';
import { makeBooking } from './factories/booking.factory.js';
import { makeProducer } from './factories/user.factory.js';
import { seedProducer, seedUser } from './utils/auth.js';
import { createTestApp, TestApp } from './utils/test-app.js';

const BOOKINGS = '/api/v1/bookings';
const RECEIVED = `${BOOKINGS}/received`;

describe('HU47/RF47 — Responder pré-reserva de experiência (e2e)', () => {
  let t: TestApp;
  const send = vi.fn().mockResolvedValue(undefined);

  beforeAll(async () => {
    t = await createTestApp((builder) =>
      builder.overrideProvider(MailService).useValue({ send }),
    );
  });

  beforeEach(async () => {
    await t.clearDatabase();
    send.mockReset();
    send.mockResolvedValue(undefined);
  });

  afterAll(async () => {
    await t?.close();
  });

  const bookings = () =>
    t.app.get<import('mongoose').Model<Booking>>(getModelToken(Booking.name));
  const experiences = () =>
    t.app.get<import('mongoose').Model<Experience>>(
      getModelToken(Experience.name),
    );

  async function producerAccount(nomeIniciativa: string) {
    const dto = makeProducer({ nomeIniciativa });
    const { user } = await seedProducer(t, dto);
    const login = await t
      .request()
      .post('/api/v1/auth/login')
      .send({ email: dto.email, senha: dto.senha })
      .expect(200);
    return {
      id: user._id.toHexString(),
      email: dto.email,
      auth: `Bearer ${login.body.accessToken as string}`,
    };
  }

  async function consumerAccount() {
    const { user, email, senha } = await seedUser(t, Role.CONSUMIDOR, {
      nome: 'Ana Oliveira',
    });
    const login = await t
      .request()
      .post('/api/v1/auth/login')
      .send({ email, senha })
      .expect(200);
    return {
      email,
      auth: `Bearer ${login.body.accessToken as string}`,
      id: user._id.toHexString(),
    };
  }

  async function seedExperience(
    producerId: string,
    nome = 'Visita e Degustação de Queijos',
  ) {
    const experience = await experiences().create({
      produtor: producerId,
      nome,
      categoria: ExperienceCategory.EXPERIENCIA,
      descricao: 'Conheça a produção artesanal de queijos.',
      valorCentavos: 4550,
      local: 'Sítio Boa Vista',
      duracao: '2 horas',
      fotos: [],
    });
    return experience._id.toHexString();
  }

  async function requestBooking(auth: string, experienciaId: string) {
    const response = await t
      .request()
      .post(BOOKINGS)
      .set('Authorization', auth)
      .send(makeBooking({ experienciaId }))
      .expect(201);
    return response.body as { id: string };
  }

  function getReceived(auth?: string) {
    const req = t.request().get(RECEIVED);
    return auth ? req.set('Authorization', auth) : req;
  }

  function getReceivedDetail(auth: string, id: string) {
    return t.request().get(`${RECEIVED}/${id}`).set('Authorization', auth);
  }

  function respond(
    auth: string | undefined,
    id: string,
    body: Record<string, unknown>,
  ) {
    const req = t.request().patch(`${RECEIVED}/${id}/response`).send(body);
    return auth ? req.set('Authorization', auth) : req;
  }

  describe('CA01 e CA02: consultar solicitações e seus dados', () => {
    it('lista apenas as solicitações do produtor e apresenta os dados para análise', async () => {
      const owner = await producerAccount('Sítio Boa Vista');
      const other = await producerAccount('Sítio Recanto Verde');
      const ownExperience = await seedExperience(owner.id);
      const otherExperience = await seedExperience(
        other.id,
        'Trilha do Cerrado',
      );
      const consumer = await consumerAccount();
      const ownBooking = await requestBooking(consumer.auth, ownExperience);
      await requestBooking(consumer.auth, otherExperience);
      const storedBooking = await bookings()
        .findById(ownBooking.id)
        .lean()
        .exec();
      expect(storedBooking?.produtor.toString()).toBe(owner.id);

      // A consulta também deve encontrar solicitações antigas com o id em texto.
      await bookings().collection.updateOne({ _id: storedBooking!._id }, [
        { $set: { produtor: owner.id } },
      ]);

      const list = await getReceived(owner.auth).expect(200);

      expect(list.body).toMatchObject({ total: 1, pagina: 1 });
      expect(list.body.itens).toHaveLength(1);
      expect(list.body.itens[0]).toMatchObject({
        id: ownBooking.id,
        experienciaId: ownExperience,
        experiencia: {
          nome: 'Visita e Degustação de Queijos',
          valorPorPessoa: 45.5,
        },
        contraparte: { nome: 'Ana Oliveira' },
        data: expect.any(String),
        horario: '09:00',
        participantes: 4,
        formaPagamento: 'pix',
        mensagem: 'Vamos com duas crianças.',
        status: BookingStatus.PENDENTE,
        criadoEm: expect.any(String),
      });
      expect(JSON.stringify(list.body)).not.toMatch(
        /email|cpf|telefone|senhaHash/i,
      );

      const detail = await getReceivedDetail(owner.auth, ownBooking.id).expect(
        200,
      );
      expect(detail.body).toMatchObject({
        id: ownBooking.id,
        experienciaId: ownExperience,
        experienciaNome: 'Visita e Degustação de Queijos',
        consumidorNome: 'Ana Oliveira',
        status: BookingStatus.PENDENTE,
      });
      expect(detail.body).not.toHaveProperty('consumidor');
      expect(detail.body).not.toHaveProperty('produtor');
    });

    it('informa lista vazia quando o produtor não recebeu solicitações', async () => {
      const producer = await producerAccount('Sítio Boa Vista');

      const response = await getReceived(producer.auth).expect(200);

      expect(response.body).toMatchObject({ itens: [], total: 0 });
    });
  });

  describe('CA03, CA04 e CA07: registrar e confirmar a resposta', () => {
    it.each([
      ['aceitar', 'aceita'],
      ['recusar', 'recusada'],
    ])(
      'registra a resposta para %s a solicitação e atualiza seu estado',
      async (_action, status) => {
        const producer = await producerAccount('Sítio Boa Vista');
        const experienceId = await seedExperience(producer.id);
        const consumer = await consumerAccount();
        const booking = await requestBooking(consumer.auth, experienceId);
        const mensagemResposta = 'Podemos receber vocês às 9h. Até lá!';

        const response = await respond(producer.auth, booking.id, {
          status,
          mensagemResposta,
        }).expect(200);

        expect(response.body).toMatchObject({
          id: booking.id,
          status,
          mensagemResposta,
        });
        const stored = await bookings().findById(booking.id).lean().exec();
        expect(stored?.status).toBe(status);
        expect(stored).toHaveProperty('mensagemResposta', mensagemResposta);
        expect(
          (await getReceivedDetail(producer.auth, booking.id).expect(200)).body
            .status,
        ).toBe(status);
      },
    );

    it('rejeita uma resposta inválida sem alterar a solicitação', async () => {
      const producer = await producerAccount('Sítio Boa Vista');
      const experienceId = await seedExperience(producer.id);
      const consumer = await consumerAccount();
      const booking = await requestBooking(consumer.auth, experienceId);

      await respond(producer.auth, booking.id, {
        status: BookingStatus.PENDENTE,
      }).expect(400);

      const stored = await bookings().findById(booking.id).lean().exec();
      expect(stored?.status).toBe(BookingStatus.PENDENTE);
    });
  });

  describe('RN21: impedir aceite de solicitação com horário passado', () => {
    it('mantém a solicitação pendente e ainda permite recusá-la', async () => {
      const producer = await producerAccount('Sítio Boa Vista');
      const experienceId = await seedExperience(producer.id);
      const consumer = await consumerAccount();
      const booking = await requestBooking(consumer.auth, experienceId);
      await bookings()
        .updateOne({ _id: booking.id }, { $set: { data: '2000-01-01' } })
        .exec();

      const response = await respond(producer.auth, booking.id, {
        status: BookingStatus.ACEITA,
      }).expect(400);

      expect(response.body.message).toMatch(/passado|aceitar/i);
      expect(
        (await bookings().findById(booking.id).lean().exec())?.status,
      ).toBe(BookingStatus.PENDENTE);

      const refusal = await respond(producer.auth, booking.id, {
        status: BookingStatus.RECUSADA,
      }).expect(200);
      expect(refusal.body.status).toBe(BookingStatus.RECUSADA);
    });
  });

  describe('CA05 e RNF08: restringir a operação ao produtor responsável', () => {
    it('impede outro produtor de consultar ou responder e mantém a solicitação pendente', async () => {
      const owner = await producerAccount('Sítio Boa Vista');
      const other = await producerAccount('Sítio Recanto Verde');
      const experienceId = await seedExperience(owner.id);
      const consumer = await consumerAccount();
      const booking = await requestBooking(consumer.auth, experienceId);

      await getReceivedDetail(other.auth, booking.id).expect(403);
      await respond(other.auth, booking.id, {
        status: BookingStatus.ACEITA,
      }).expect(403);

      const stored = await bookings().findById(booking.id).lean().exec();
      expect(stored?.status).toBe(BookingStatus.PENDENTE);
    });

    it('exige autenticação e perfil de produtor', async () => {
      const producer = await producerAccount('Sítio Boa Vista');
      const experienceId = await seedExperience(producer.id);
      const consumer = await consumerAccount();
      const booking = await requestBooking(consumer.auth, experienceId);
      const administrator = await seedUser(t, Role.ADMINISTRADOR);
      const login = await t
        .request()
        .post('/api/v1/auth/login')
        .send({ email: administrator.email, senha: administrator.senha })
        .expect(200);
      const adminAuth = `Bearer ${login.body.accessToken as string}`;

      await getReceived().expect(401);
      await getReceived(consumer.auth).expect(403);
      await respond(undefined, booking.id, {
        status: BookingStatus.ACEITA,
      }).expect(401);
      await respond(consumer.auth, booking.id, {
        status: BookingStatus.ACEITA,
      }).expect(403);
      await respond(adminAuth, booking.id, {
        status: BookingStatus.ACEITA,
      }).expect(403);
    });
  });

  describe('CA06: impedir resposta a solicitação indisponível', () => {
    it.each([
      BookingStatus.ACEITA,
      BookingStatus.RECUSADA,
      BookingStatus.CANCELADA,
    ])('não altera uma solicitação já %s', async (status) => {
      const producer = await producerAccount('Sítio Boa Vista');
      const experienceId = await seedExperience(producer.id);
      const consumer = await consumerAccount();
      const booking = await requestBooking(consumer.auth, experienceId);
      const mensagemRespostaAtual = 'Resposta anterior';
      await bookings()
        .updateOne(
          { _id: booking.id },
          { $set: { status, mensagemResposta: mensagemRespostaAtual } },
        )
        .exec();

      const response = await respond(producer.auth, booking.id, {
        status: BookingStatus.ACEITA,
        mensagemResposta: 'Nova resposta',
      }).expect(409);

      expect(JSON.stringify(response.body.message)).toMatch(status);
      const stored = await bookings().findById(booking.id).lean().exec();
      expect(stored?.status).toBe(status);
      expect(stored).toHaveProperty('mensagemResposta', mensagemRespostaAtual);
    });
  });

  describe('CA08: preservar a solicitação quando o registro falha', () => {
    it('informa a falha e mantém o estado e a resposta anteriores', async () => {
      const producer = await producerAccount('Sítio Boa Vista');
      const experienceId = await seedExperience(producer.id);
      const consumer = await consumerAccount();
      const booking = await requestBooking(consumer.auth, experienceId);
      const update = vi.spyOn(bookings(), 'findOneAndUpdate');
      update.mockImplementationOnce(() => {
        throw new Error('Falha simulada ao registrar a resposta');
      });

      const response = await respond(producer.auth, booking.id, {
        status: BookingStatus.ACEITA,
        mensagemResposta: 'Podemos receber vocês.',
      }).expect(500);

      expect(response.body.message).toMatch(/erro|falha/i);
      const stored = await bookings().findById(booking.id).lean().exec();
      expect(stored?.status).toBe(BookingStatus.PENDENTE);
      expect(stored).not.toHaveProperty('mensagemResposta');
    });
  });

  describe('RN22: notificar o consumidor sem desfazer a resposta', () => {
    it('envia e-mail ao consumidor quando o produtor responde', async () => {
      const producer = await producerAccount('Sítio Boa Vista');
      const experienceId = await seedExperience(producer.id);
      const consumer = await consumerAccount();
      const booking = await requestBooking(consumer.auth, experienceId);

      await respond(producer.auth, booking.id, {
        status: BookingStatus.ACEITA,
        mensagemResposta: 'Podemos receber vocês às 9h.',
      }).expect(200);

      await vi.waitFor(() => {
        expect(send).toHaveBeenCalledWith(
          expect.objectContaining({ to: consumer.email }),
        );
        expect(send).toHaveBeenCalledWith(
          expect.objectContaining({ to: producer.email }),
        );
      });
    });

    it('preserva a resposta registrada mesmo se o envio de e-mail falhar', async () => {
      send.mockRejectedValue(new Error('SMTP indisponível'));
      const producer = await producerAccount('Sítio Boa Vista');
      const experienceId = await seedExperience(producer.id);
      const consumer = await consumerAccount();
      const booking = await requestBooking(consumer.auth, experienceId);

      await respond(producer.auth, booking.id, {
        status: BookingStatus.ACEITA,
        mensagemResposta: 'Podemos receber vocês às 9h.',
      });

      await vi.waitFor(
        async () => {
          expect(send).toHaveBeenCalled();
          const stored = await bookings().findById(booking.id).lean().exec();
          expect(stored?.status).toBe(BookingStatus.ACEITA);
          expect(stored).toHaveProperty(
            'mensagemResposta',
            'Podemos receber vocês às 9h.',
          );
        },
        { timeout: 5000 },
      );
    });
  });
});
