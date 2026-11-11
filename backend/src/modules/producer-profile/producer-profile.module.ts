import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/user.schema.js';
import { ProducerPhotoService } from './producer-photo.service.js';
import { ProducerProfileController } from './producer-profile.controller.js';
import { ProducerProfileService } from './producer-profile.service.js';
import {
  ProducerPhoto,
  ProducerPhotoSchema,
} from './schemas/producer-photo.schema.js';

/**
 * HU12 — trajetória e foto de perfil do produtor (CP1). Lê e grava na coleção
 * `users`; o binário da foto fica em `producer_photos`.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: ProducerPhoto.name, schema: ProducerPhotoSchema },
    ]),
  ],
  controllers: [ProducerProfileController],
  providers: [ProducerProfileService, ProducerPhotoService],
})
export class ProducerProfileModule {}
