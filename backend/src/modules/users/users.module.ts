import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PasswordHasher } from '../../common/crypto/password-hasher.js';
import { PiiCipher } from '../../common/crypto/pii-cipher.js';
import { User, UserSchema } from './schemas/user.schema.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
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
