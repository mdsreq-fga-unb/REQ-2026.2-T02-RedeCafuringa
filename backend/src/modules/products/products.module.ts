import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PhotosModule } from '../../common/photos/photos.module.js';
import { User, UserSchema } from '../users/schemas/user.schema.js';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';
import { Product, ProductSchema } from './schemas/product.schema.js';

/**
 * HU15 — cadastro de produtos (CP2). Dados em `products`; as fotos usam a
 * galeria genérica (`photos`, dono `produto`); o responsável é lido de `users`.
 */
@Module({
  imports: [
    PhotosModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
