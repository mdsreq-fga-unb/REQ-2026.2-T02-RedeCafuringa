/** Perfis de acesso previstos na plataforma (RN01). */
export enum Role {
  CONSUMIDOR = 'CONSUMIDOR',
  PRODUTOR = 'PRODUTOR',
  ADMINISTRADOR = 'ADMINISTRADOR',
}

export function isRole(value: unknown): value is Role {
  return Object.values(Role).includes(value as Role);
}
