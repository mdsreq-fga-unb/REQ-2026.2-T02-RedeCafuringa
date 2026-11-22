import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PhotosModule } from '../../common/photos/photos.module.js';
import { User, UserSchema } from '../users/schemas/user.schema.js';
import { ExperiencesController } from './experiences.controller.js';
import { ExperiencesService } from './experiences.service.js';
import { Experience, ExperienceSchema } from './schemas/experience.schema.js';

/**
 * HU21 — cadastro de experiências (CP3). Dados em `experiences`; as fotos usam
 * a galeria genérica (`photos`, dono `experiencia`); o responsável é lido de `users`.
 */
@Module({
  imports: [
    PhotosModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Experience.name, schema: ExperienceSchema },
    ]),
  ],
  controllers: [ExperiencesController],
  providers: [ExperiencesService],
  exports: [ExperiencesService],
})
export class ExperiencesModule {}
