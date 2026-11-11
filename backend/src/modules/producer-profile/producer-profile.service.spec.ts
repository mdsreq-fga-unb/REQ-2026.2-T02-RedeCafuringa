import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import type { Model } from 'mongoose';
import { ProducerCategory } from '../users/domain/producer-category.js';
import { Role } from '../users/domain/role.js';
import type { User } from '../users/schemas/user.schema.js';
import { ProducerProfileService } from './producer-profile.service.js';

const NOW = new Date('2026-11-06T12:00:00.000Z');

/** Consulta encadeável do Mongoose: `.select()`/`.lean()` devolvem a própria consulta. */
function query<T>(value: T) {
  const q = {
    select: vi.fn(() => q),
    lean: vi.fn(() => q),
    exec: vi.fn().mockResolvedValue(value),
  };
  return q;
}

/** Campos que nunca devem ser lidos para montar as respostas desta HU. */
const PRIVATE_FIELDS = [
  'senhaHash',
  'cpfHash',
  'cpfCifrado',
  'cnpjHash',
  'cnpjCifrado',
  'email',
];

function producerDoc(overrides: Record<string, unknown> = {}) {
  const _id = new Types.ObjectId();
  return {
    _id,
    id: _id.toHexString(),
    nomeIniciativa: 'Horta Cafuringa',
    nomeResponsavel: 'João da Silva',
    categoriaOfertada: ProducerCategory.PRODUTOS,
    email: 'joao@exemplo.com',
    cpfCifrado: 'enc',
    cpfHash: 'hash',
    senhaHash: 'argon',
    telefone: '61999990000',
    telefonePublico: false,
    perfil: Role.PRODUTOR,
    ativo: true,
    ...overrides,
  };
}

function setup() {
  const model = {
    findOne: vi.fn().mockReturnValue(query(null)),
    findOneAndUpdate: vi.fn().mockReturnValue(query(null)),
  };
  const service = new ProducerProfileService(model as unknown as Model<User>);
  return { service, model };
}

describe('ProducerProfileService', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getOwn (HU12 CA01)', () => {
    it('devolve a trajetória gravada, com o telefone e a visibilidade', async () => {
      const { service, model } = setup();
      const doc = producerDoc({
        trajetoria: 'Começamos em 1990.',
        atividades: 'Horta e visitas.',
        telefonePublico: true,
        trajetoriaAtualizadaEm: NOW,
      });
      model.findOne.mockReturnValue(query(doc));

      const result = await service.getOwn(doc.id);

      expect(result).toEqual({
        trajetoria: 'Começamos em 1990.',
        atividades: 'Horta e visitas.',
        telefone: '61999990000',
        telefonePublico: true,
        atualizadoEm: NOW.toISOString(),
      });
    });

    it('RF12: inclui o caminho versionado da foto quando houver', async () => {
      const { service, model } = setup();
      const doc = producerDoc({ fotoVersao: 'abc123' });
      model.findOne.mockReturnValue(query(doc));

      const result = await service.getOwn(doc.id);

      expect(result.fotoUrl).toBe(`/producers/${doc.id}/photo?v=abc123`);
    });

    it('produtor ainda sem trajetória: devolve só o estado atual', async () => {
      const { service, model } = setup();
      const doc = producerDoc();
      model.findOne.mockReturnValue(query(doc));

      const result = await service.getOwn(doc.id);

      expect(result).toEqual({
        telefone: '61999990000',
        telefonePublico: false,
      });
    });

    it('só procura contas de produtor ativas', async () => {
      const { service, model } = setup();
      const id = new Types.ObjectId().toHexString();
      model.findOne.mockReturnValue(query(producerDoc()));

      await service.getOwn(id);

      expect(model.findOne).toHaveBeenCalledWith({
        _id: id,
        perfil: Role.PRODUTOR,
        ativo: true,
      });
    });

    it('conta inexistente ou desativada: 404', async () => {
      const { service } = setup();

      await expect(
        service.getOwn(new Types.ObjectId().toHexString()),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('save (HU12 CA04)', () => {
    it('grava trajetória e atividades na conta do próprio produtor', async () => {
      const { service, model } = setup();
      const doc = producerDoc({
        trajetoria: 'Nova história',
        atividades: 'Nova atuação',
        trajetoriaAtualizadaEm: NOW,
      });
      model.findOneAndUpdate.mockReturnValue(query(doc));

      const result = await service.save(doc.id, {
        trajetoria: 'Nova história',
        atividades: 'Nova atuação',
      });

      expect(model.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: doc.id, perfil: Role.PRODUTOR, ativo: true },
        {
          $set: {
            trajetoria: 'Nova história',
            atividades: 'Nova atuação',
            trajetoriaAtualizadaEm: NOW,
          },
        },
        expect.objectContaining({ returnDocument: 'after' }),
      );
      expect(result.trajetoria).toBe('Nova história');
    });

    it('lê de volta só os campos da resposta, nunca senha, hashes ou e-mail', async () => {
      const { service, model } = setup();
      const q = query(producerDoc());
      model.findOneAndUpdate.mockReturnValue(q);

      await service.save('64b000000000000000000001', { trajetoria: 'x' });

      const [, , options] = model.findOneAndUpdate.mock.calls[0] as [
        unknown,
        unknown,
        { projection: string },
      ];
      for (const field of PRIVATE_FIELDS) {
        expect(options.projection).not.toContain(field);
      }
      expect(q.lean).toHaveBeenCalled();
    });

    it('telefone e visibilidade só mudam quando enviados', async () => {
      const { service, model } = setup();
      model.findOneAndUpdate.mockReturnValue(query(producerDoc()));

      await service.save('64b000000000000000000001', {
        trajetoria: 'x',
        telefone: '61988887777',
        telefonePublico: true,
      });

      const update = model.findOneAndUpdate.mock.calls[0][1] as {
        $set: Record<string, unknown>;
      };
      expect(update.$set).toMatchObject({
        telefone: '61988887777',
        telefonePublico: true,
      });
    });

    it('telefone null remove o telefone cadastrado e o torna privado', async () => {
      const { service, model } = setup();
      model.findOneAndUpdate.mockReturnValue(query(producerDoc()));

      await service.save('64b000000000000000000001', {
        trajetoria: 'x',
        telefone: null,
        telefonePublico: true,
      });

      const update = model.findOneAndUpdate.mock.calls[0][1] as {
        $set: Record<string, unknown>;
        $unset?: Record<string, unknown>;
      };
      expect(update.$unset).toEqual({ telefone: 1 });
      expect(update.$set).not.toHaveProperty('telefone');
      // Sem telefone não há o que divulgar, mesmo que o pedido diga o contrário.
      expect(update.$set.telefonePublico).toBe(false);
    });

    it('sem pedir a remoção, nada é apagado', async () => {
      const { service, model } = setup();
      model.findOneAndUpdate.mockReturnValue(query(producerDoc()));

      await service.save('64b000000000000000000001', {
        trajetoria: 'x',
        telefone: '61988887777',
      });

      const update = model.findOneAndUpdate.mock.calls[0][1] as {
        $unset?: unknown;
      };
      expect(update.$unset).toBeUndefined();
    });

    it('sem telefone no pedido, não toca no telefone nem na visibilidade', async () => {
      const { service, model } = setup();
      model.findOneAndUpdate.mockReturnValue(query(producerDoc()));

      await service.save('64b000000000000000000001', { trajetoria: 'x' });

      const update = model.findOneAndUpdate.mock.calls[0][1] as {
        $set: Record<string, unknown>;
      };
      expect(update.$set).not.toHaveProperty('telefone');
      expect(update.$set).not.toHaveProperty('telefonePublico');
    });

    it('atividades omitidas apagam o valor anterior (PUT substitui o registro)', async () => {
      const { service, model } = setup();
      model.findOneAndUpdate.mockReturnValue(query(producerDoc()));

      await service.save('64b000000000000000000001', { trajetoria: 'x' });

      const update = model.findOneAndUpdate.mock.calls[0][1] as {
        $set: Record<string, unknown>;
      };
      expect(update.$set.atividades).toBe('');
    });

    it('nunca grava campos fora do contrato (mass assignment)', async () => {
      const { service, model } = setup();
      model.findOneAndUpdate.mockReturnValue(query(producerDoc()));

      await service.save('64b000000000000000000001', {
        trajetoria: 'x',
        perfil: 'ADMINISTRADOR',
        email: 'x@y.com',
        senhaHash: 'z',
      } as never);

      const update = model.findOneAndUpdate.mock.calls[0][1] as {
        $set: Record<string, unknown>;
      };
      expect(Object.keys(update.$set).sort()).toEqual(
        ['atividades', 'trajetoria', 'trajetoriaAtualizadaEm'].sort(),
      );
    });

    it('conta que não é produtor ativo: 404 e nada é gravado', async () => {
      const { service } = setup();

      await expect(
        service.save(new Types.ObjectId().toHexString(), { trajetoria: 'x' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('getPublic (HU12 CA05, RN07, RNF11)', () => {
    it.each(['abc', '', '123', '{"$ne":null}', 'zzzzzzzzzzzzzzzzzzzzzzzz'])(
      'id inválido (%s): 404 sem consultar o banco',
      async (id) => {
        const { service, model } = setup();

        await expect(service.getPublic(id)).rejects.toBeInstanceOf(
          NotFoundException,
        );
        expect(model.findOne).not.toHaveBeenCalled();
      },
    );

    it('produtor inexistente, inativo ou de outro perfil: 404', async () => {
      const { service, model } = setup();
      const id = new Types.ObjectId().toHexString();

      await expect(service.getPublic(id)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(model.findOne).toHaveBeenCalledWith({
        _id: id,
        perfil: Role.PRODUTOR,
        ativo: true,
      });
    });

    it('lê do banco só os campos públicos, sem hidratar o documento', async () => {
      const { service, model } = setup();
      const doc = producerDoc({ trajetoria: 'História' });
      const q = query(doc);
      model.findOne.mockReturnValue(q);

      await service.getPublic(doc.id);

      const [projection] = q.select.mock.calls[0] as unknown as [string];
      for (const field of PRIVATE_FIELDS) {
        expect(projection).not.toContain(field);
      }
      expect(q.lean).toHaveBeenCalled();
    });

    it('expõe só os campos públicos', async () => {
      const { service, model } = setup();
      const doc = producerDoc({
        trajetoria: 'História',
        atividades: 'Atuação',
        localidade: 'Fazenda X',
      });
      model.findOne.mockReturnValue(query(doc));

      const result = await service.getPublic(doc.id);

      expect(result).toEqual({
        id: doc.id,
        nomeIniciativa: 'Horta Cafuringa',
        categoriaOfertada: ProducerCategory.PRODUTOS,
        trajetoria: 'História',
        atividades: 'Atuação',
      });
    });

    it('RF12: inclui a foto pública quando o produtor tem uma', async () => {
      const { service, model } = setup();
      const doc = producerDoc({ trajetoria: 'História', fotoVersao: 'v9' });
      model.findOne.mockReturnValue(query(doc));

      const result = await service.getPublic(doc.id);

      expect(result.fotoUrl).toBe(`/producers/${doc.id}/photo?v=v9`);
    });

    it('nunca vaza dado privado, mesmo que o documento os tenha', async () => {
      const { service, model } = setup();
      const doc = producerDoc({
        trajetoria: 'História',
        telefonePublico: false,
      });
      model.findOne.mockReturnValue(query(doc));

      const json = JSON.stringify(await service.getPublic(doc.id));

      for (const secret of [
        'joao@exemplo.com',
        'João da Silva',
        'enc',
        'hash',
        'argon',
        '61999990000',
        'cpf',
        'senha',
      ]) {
        expect(json).not.toContain(secret);
      }
    });

    it('mostra o telefone só se o produtor autorizou', async () => {
      const { service, model } = setup();
      const doc = producerDoc({
        telefonePublico: true,
        trajetoria: 'História',
      });
      model.findOne.mockReturnValue(query(doc));

      expect((await service.getPublic(doc.id)).telefone).toBe('61999990000');
    });

    it.each([undefined, ''])(
      'produtor sem trajetória publicada (%j): 404, perfil oculto',
      async (trajetoria) => {
        const { service, model } = setup();
        const doc = producerDoc({ trajetoria });
        model.findOne.mockReturnValue(query(doc));

        await expect(service.getPublic(doc.id)).rejects.toBeInstanceOf(
          NotFoundException,
        );
      },
    );
  });
});
