import { BadRequestException, Injectable } from '@nestjs/common';
import { ExperiencesService } from '../experiences/experiences.service.js';
import { ProducerProfileService } from '../producer-profile/producer-profile.service.js';
import { ProductCategory } from '../products/domain/product.js';
import { DEFAULT_PRODUCTS_PAGE } from '../products/dto/list-products.query.js';
import { ProductsService } from '../products/products.service.js';
import { parseSearchTerm } from './domain/search-term.js';
import type { SearchQuery } from './dto/search.query.js';
import type { SearchResponse } from './dto/search.response.js';

/**
 * HU36/RF36: busca única de ofertas. Reaproveita os catálogos públicos já
 * existentes (só ofertas disponíveis de produtor ativo, RN15) e junta o
 * resultado por tipo. Eventos ficam fora do MVP.
 */
@Injectable()
export class SearchService {
  constructor(
    private readonly products: ProductsService,
    private readonly experiences: ExperiencesService,
    private readonly producers: ProducerProfileService,
  ) {}

  async search(query: SearchQuery): Promise<SearchResponse> {
    const parsed = parseSearchTerm(query.busca);
    if (!parsed.ok) throw new BadRequestException([parsed.message]);
    const { term } = parsed;
    const limite = query.limite ?? DEFAULT_PRODUCTS_PAGE;

    const [produtos, experiencias, produtores] = await Promise.all([
      this.products.list({
        busca: term,
        categoria: ProductCategory.PRODUTOS,
        limite,
      }),
      this.experiences.list({ busca: term, limite }),
      this.producers.listPublic(term),
    ]);

    return {
      termo: term,
      produtores: {
        itens: produtores.slice(0, limite),
        total: produtores.length,
      },
      produtos: { itens: produtos.itens, total: produtos.total },
      experiencias: { itens: experiencias.itens, total: experiencias.total },
    };
  }
}
