/** Perfis de acesso previstos na plataforma (RN01). */
export enum Role {
  CONSUMIDOR = 'CONSUMIDOR',
  PRODUTOR = 'PRODUTOR',
  ADMINISTRADOR = 'ADMINISTRADOR',
}

export function isRole(value: unknown): value is Role {
  return Object.values(Role).includes(value as Role);
}

/**
 * Perfis com tela de login própria. A mesma pessoa pode ter uma conta em cada
 * um, com o mesmo e-mail e CPF; o login escolhe a conta pelo perfil da tela.
 */
export const LOGIN_PROFILES = [Role.CONSUMIDOR, Role.PRODUTOR] as const;
export type LoginProfile = (typeof LOGIN_PROFILES)[number];
