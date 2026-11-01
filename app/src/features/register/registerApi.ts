import type { RegisterPayload } from './registerForm';

export type CreateProducerBody = {
  natureza: 'PRODUTOR' | 'PROPRIEDADE' | 'ASSOCIACAO' | 'COMUNIDADE';
  nome: string;
  cpf?: string;
  cnpj?: string;
  telefone: string;
  email: string;
  endereco: string;
  senha: string;
  maiorDeIdade: true;
};

const NATURE_TO_API = {
  producer: 'PRODUTOR',
  property: 'PROPRIEDADE',
  association: 'ASSOCIACAO',
  community: 'COMUNIDADE',
} as const;

export function toCreateProducerBody(payload: RegisterPayload): CreateProducerBody {
  const { document } = payload;
  return {
    natureza: NATURE_TO_API[payload.nature],
    nome: payload.name,
    ...(document.length === 14 ? { cnpj: document } : { cpf: document }),
    telefone: payload.phone,
    email: payload.email,
    endereco: payload.address,
    senha: payload.password,
    maiorDeIdade: true,
  };
}