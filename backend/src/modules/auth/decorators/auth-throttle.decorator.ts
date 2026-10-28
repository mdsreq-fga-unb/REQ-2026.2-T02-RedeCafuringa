import { ExecutionContext, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const AUTH_THROTTLER = 'auth';
const AUTH_THROTTLE_KEY = 'auth:throttle';

/**
 * Aplica o limite mais restrito de tentativas (AUTH_THROTTLE_LIMIT) em rotas
 * sensíveis a força bruta, como login e cadastro. O limite global continua valendo.
 */
export const AuthThrottle = () => SetMetadata(AUTH_THROTTLE_KEY, true);

const reflector = new Reflector();

/** Usado no `skipIf` do throttler nomeado: só conta rotas com @AuthThrottle(). */
export function isNotAuthThrottled(context: ExecutionContext): boolean {
  return !reflector.getAllAndOverride<boolean>(AUTH_THROTTLE_KEY, [
    context.getHandler(),
    context.getClass(),
  ]);
}
