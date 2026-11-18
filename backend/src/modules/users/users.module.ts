import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PasswordHasher } from '../../common/crypto/password-hasher.js';
import { PiiCipher } from '../../common/crypto/pii-cipher.js';
import { PhotosModule } from '../../common/photos/photos.module.js';
import {
  PasswordResetToken,
  PasswordResetTokenSchema,
} from '../auth/password-reset/schemas/password-reset-token.schema.js';
import {
  Experience,
  ExperienceSchema,
} from '../experiences/schemas/experience.schema.js';
import {
  ProducerPhoto,
  ProducerPhotoSchema,
} from '../producer-profile/schemas/producer-photo.schema.js';
import { Product, ProductSchema } from '../products/schemas/product.schema.js';
import { AccountDeletionService } from './account-deletion.service.js';
import { BannedIdentitiesService } from './banned-identities.service.js';
import {
  BannedIdentity,
  BannedIdentitySchema,
} from './schemas/banned-identity.schema.js';
import { AdminBootstrapService } from './admin-bootstrap.service.js';
import { User, UserSchema } from './schemas/user.schema.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

@Module({
  imports: [
    PhotosModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      // A exclusão da conta leva junto o que só existe por causa dela.
      { name: Product.name, schema: ProductSchema },
      { name: Experience.name, schema: ExperienceSchema },
      { name: ProducerPhoto.name, schema: ProducerPhotoSchema },
      { name: PasswordResetToken.name, schema: PasswordResetTokenSchema },
      { name: BannedIdentity.name, schema: BannedIdentitySchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    AccountDeletionService,
    BannedIdentitiesService,
    AdminBootstrapService,
    PasswordHasher,
    {
      provide: PiiCipher,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new PiiCipher(
          config.getOrThrow<string>('PII_HMAC_SECRET'),
          config.getOrThrow<string>('PII_ENCRYPTION_KEY'),
        ),
    },
  ],
  exports: [UsersService, PasswordHasher],
})
export class UsersModule {}
