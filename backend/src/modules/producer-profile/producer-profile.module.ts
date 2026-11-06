import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/user.schema.js';
import { ProducerProfileController } from './producer-profile.controller.js';
import { ProducerProfileService } from './producer-profile.service.js';

/** HU12 — trajetória do produtor (CP1). Lê e grava na coleção `users`. */
@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [ProducerProfileController],
  providers: [ProducerProfileService],
})
export class ProducerProfileModule {}
