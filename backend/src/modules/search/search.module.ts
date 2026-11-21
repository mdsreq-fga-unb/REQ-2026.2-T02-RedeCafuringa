import { Module } from '@nestjs/common';
import { ExperiencesModule } from '../experiences/experiences.module.js';
import { ProducerProfileModule } from '../producer-profile/producer-profile.module.js';
import { ProductsModule } from '../products/products.module.js';
import { SearchController } from './search.controller.js';
import { SearchService } from './search.service.js';

/**
 * HU36 — busca de ofertas (CP4). Não tem dados próprios: consulta os
 * catálogos públicos de produtos, experiências e produtores.
 */
@Module({
  imports: [ProductsModule, ExperiencesModule, ProducerProfileModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
