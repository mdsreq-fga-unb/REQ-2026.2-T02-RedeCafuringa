import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { MetricsModule } from '../metrics/metrics.module.js';
import { UsersModule } from '../users/users.module.js';
import { PasswordResetController } from './password-reset/password-reset.controller.js';
import { PasswordResetService } from './password-reset/password-reset.service.js';
import {
  PasswordResetToken,
  PasswordResetTokenSchema,
} from './password-reset/schemas/password-reset-token.schema.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { RolesGuard } from './guards/roles.guard.js';

@Module({
  imports: [
    UsersModule,
    MetricsModule,
    MongooseModule.forFeature([
      { name: PasswordResetToken.name, schema: PasswordResetTokenSchema },
    ]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          algorithm: 'HS256',
          expiresIn: config.get<number>('JWT_EXPIRES_IN', 900),
        },
        // Fixa o algoritmo na verificação: impede "alg: none" e troca de algoritmo.
        verifyOptions: { algorithms: ['HS256'] },
      }),
    }),
  ],
  controllers: [AuthController, PasswordResetController],
  providers: [AuthService, PasswordResetService, JwtAuthGuard, RolesGuard],
  // Os guards são registrados como APP_GUARD no AppModule, na ordem certa.
  exports: [JwtModule, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
