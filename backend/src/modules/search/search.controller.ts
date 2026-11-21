import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ErrorResponse } from '../../common/dto/error.response.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { SearchQuery } from './dto/search.query.js';
import { SearchResponse } from './dto/search.response.js';
import { SearchService } from './search.service.js';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Buscar ofertas',
    description:
      'HU36 (CA01-CA09), RN15: busca pública, sem login, por produtores, produtos e experiências da região. Procura o termo, sem diferenciar acentos e maiúsculas, no nome do produto ou da experiência, no nome da iniciativa e, nos produtores, também na trajetória e nas atividades. Só aparecem ofertas disponíveis de produtores ativos e perfis publicados. O resultado vem agrupado por tipo, cada grupo com `itens` (até `limite`) e `total`; grupo vazio significa que nada foi encontrado naquele tipo. Termo ausente, curto, longo ou só com símbolos devolve 400 com a orientação de correção. Eventos ficam fora do MVP.',
  })
  @ApiOkResponse({
    type: SearchResponse,
    description: 'Resultados agrupados por tipo de oferta (podem estar vazios)',
  })
  @ApiBadRequestResponse({
    description: 'Termo de busca inválido ou limite fora do intervalo',
    type: ErrorResponse,
  })
  find(@Query() query: SearchQuery): Promise<SearchResponse> {
    return this.search.search(query);
  }
}
