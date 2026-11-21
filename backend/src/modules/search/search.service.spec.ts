import { BadRequestException } from '@nestjs/common';
import type { ExperiencesService } from '../experiences/experiences.service.js';
import type { ProducerProfileService } from '../producer-profile/producer-profile.service.js';
import { ProductCategory } from '../products/domain/product.js';
import type { ProductsService } from '../products/products.service.js';
import { MAX_SEARCH_TERM_LENGTH } from './domain/search-term.js';
import { SearchService } from './search.service.js';

const producer = (n: number) => ({ id: `produtor-${n}`, trajetoria: 'Texto' });

function setup() {
  const products = {
    list: vi.fn().mockResolvedValue({
      itens: [{ id: 'p1' }],
      total: 1,
      pagina: 1,
      limite: 20,
    }),
  };
  const experiences = {
    list: vi.fn().mockResolvedValue({
      itens: [{ id: 'e1' }, { id: 'e2' }],
      total: 2,
      pagina: 1,
      limite: 20,
    }),
  };
  const producers = {
    listPublic: vi.fn().mockResolvedValue([producer(1)]),
  };
  const service = new SearchService(
    products as unknown as ProductsService,
    experiences as unknown as ExperiencesService,
    producers as unknown as ProducerProfileService,
  );
  return { service, products, experiences, producers };
}

describe('SearchService (HU36/RF36)', () => {
  describe('busca válida (CA03, CA04)', () => {
    it('procura o termo normalizado em produtos, experiências e produtores', async () => {
      const { service, products, experiences, producers } = setup();

      await service.search({ busca: '  café   torrado ' });

      expect(products.list).toHaveBeenCalledWith({
        busca: 'café torrado',
        categoria: ProductCategory.PRODUTOS,
        limite: 20,
      });
      expect(experiences.list).toHaveBeenCalledWith({
        busca: 'café torrado',
        limite: 20,
      });
      expect(producers.listPublic).toHaveBeenCalledWith('café torrado');
    });

    it('agrupa os resultados por tipo de oferta, com o total de cada um', async () => {
      const { service } = setup();

      const res = await service.search({ busca: 'cafe' });

      expect(res).toEqual({
        termo: 'cafe',
        produtores: { itens: [producer(1)], total: 1 },
        produtos: { itens: [{ id: 'p1' }], total: 1 },
        experiencias: { itens: [{ id: 'e1' }, { id: 'e2' }], total: 2 },
      });
    });

    it('usa o limite pedido em cada tipo e mantém o total completo dos produtores', async () => {
      const { service, products, experiences, producers } = setup();
      producers.listPublic.mockResolvedValue([1, 2, 3, 4].map(producer));

      const res = await service.search({ busca: 'cafe', limite: 2 });

      expect(products.list).toHaveBeenCalledWith(
        expect.objectContaining({ limite: 2 }),
      );
      expect(experiences.list).toHaveBeenCalledWith(
        expect.objectContaining({ limite: 2 }),
      );
      expect(res.produtores.itens).toEqual([producer(1), producer(2)]);
      expect(res.produtores.total).toBe(4);
    });
  });

  describe('sem resultados (CA06)', () => {
    it('devolve os três grupos vazios, sem erro', async () => {
      const { service, products, experiences, producers } = setup();
      products.list.mockResolvedValue({
        itens: [],
        total: 0,
        pagina: 1,
        limite: 20,
      });
      experiences.list.mockResolvedValue({
        itens: [],
        total: 0,
        pagina: 1,
        limite: 20,
      });
      producers.listPublic.mockResolvedValue([]);

      await expect(service.search({ busca: 'xyz' })).resolves.toEqual({
        termo: 'xyz',
        produtores: { itens: [], total: 0 },
        produtos: { itens: [], total: 0 },
        experiencias: { itens: [], total: 0 },
      });
    });
  });

  describe('termo inválido (CA08)', () => {
    it.each([
      ['ausente', undefined, 'Informe o que você quer buscar.'],
      ['só espaços', '   ', 'Informe o que você quer buscar.'],
      ['curto demais', 'a', 'Digite pelo menos 2 caracteres para buscar.'],
      [
        'longo demais',
        'a'.repeat(MAX_SEARCH_TERM_LENGTH + 1),
        `A busca deve ter no máximo ${MAX_SEARCH_TERM_LENGTH} caracteres.`,
      ],
      [
        'só símbolos',
        '%%%',
        'Use apenas letras, números e pontuação simples. Remova símbolos especiais e tente de novo.',
      ],
    ])(
      '%s: 400 com a orientação de correção',
      async (_caso, busca, message) => {
        const { service } = setup();

        const error = await service.search({ busca }).catch((e: unknown) => e);

        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).getResponse()).toMatchObject({
          message: [message],
        });
      },
    );

    it('não consulta nenhuma fonte quando o termo é inválido', async () => {
      const { service, products, experiences, producers } = setup();

      await service.search({ busca: '%%%' }).catch(() => undefined);

      expect(products.list).not.toHaveBeenCalled();
      expect(experiences.list).not.toHaveBeenCalled();
      expect(producers.listPublic).not.toHaveBeenCalled();
    });
  });
});
