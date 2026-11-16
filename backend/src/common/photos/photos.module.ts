import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PhotoGalleryService } from './photo-gallery.service.js';
import { Photo, PhotoSchema } from './photo.schema.js';

/**
 * Galerias de fotos reutilizáveis (coleção `photos`). Importe este módulo na
 * entidade que tem várias fotos e injete `PhotoGalleryService`.
 */
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Photo.name, schema: PhotoSchema }]),
  ],
  providers: [PhotoGalleryService],
  exports: [PhotoGalleryService],
})
export class PhotosModule {}
