import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'auth:isPublic';

/**
 * Libera a rota do JwtAuthGuard global. Toda rota sem este decorator exige
 * login (negação por padrão — RNF08).
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
