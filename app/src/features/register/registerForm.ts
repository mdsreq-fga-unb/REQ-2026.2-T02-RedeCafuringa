import { onlyDigits } from '@/features/auth/cpf';
import { isValidCpf } from '@/features/auth/cpf';
import {
  isValidCnpj,
  isValidEmail,
  isValidPassword,
  isValidPhone,
  passwordsMatch,
} from './validators';

export type RegisterNature = 'producer' | 'property' | 'association' | 'community';
export type DocumentType = 'cpf' | 'cnpj';

export interface RegisterFormValues {
  nature: RegisterNature | '';
  documentType: DocumentType;
  name: string;
  document: string;
  phone: string;
  email: string;
  address: string;
  password: string;
  confirmPassword: string;
  isAdult: boolean;
}

export type RegisterFormErrors = Partial<Record<keyof RegisterFormValues, string>>;

export function validateRegisterForm(values: RegisterFormValues): RegisterFormErrors {
  const errors: RegisterFormErrors = {};
  const document = values.document.trim();
  const phone = values.phone.trim();
  const email = values.email.trim();

  const isCnpj = values.documentType === 'cnpj';
  const documentLabel = isCnpj ? 'CNPJ' : 'CPF';
  const documentIsValid = isCnpj ? isValidCnpj(document) : isValidCpf(document);

  if (!values.nature) errors.nature = 'Escolha a natureza do cadastro.';
  if (!values.name.trim()) errors.name = 'Informe o nome.';

  if (!document) errors.document = `Informe o ${documentLabel}.`;
  else if (!documentIsValid) errors.document = `${documentLabel} inválido.`;

  if (!phone) errors.phone = 'Informe o telefone.';
  else if (!isValidPhone(phone)) errors.phone = 'Telefone inválido. Informe o DDD e o número.';

  if (!email) errors.email = 'Informe o e-mail.';
  else if (!isValidEmail(email)) errors.email = 'E-mail inválido.';

  if (!values.address.trim()) errors.address = 'Informe o endereço.';

  if (!values.password) errors.password = 'Informe a senha.';
  else if (!isValidPassword(values.password)) {
    errors.password = 'A senha deve ter no mínimo 8 caracteres.';
  }

  if (!values.confirmPassword) errors.confirmPassword = 'Confirme a senha.';
  else if (!passwordsMatch(values.password, values.confirmPassword)) {
    errors.confirmPassword = 'As senhas não conferem.';
  }

  if (!values.isAdult) errors.isAdult = 'Confirme que você é maior de 18 anos.';

  return errors;
}

export interface RegisterPayload {
  nature: RegisterNature;
  name: string;
  document: string;
  phone: string;
  email: string;
  address: string;
  password: string;
  isAdult: true;
}

export function buildRegisterPayload(values: RegisterFormValues): RegisterPayload {
  return {
    nature: values.nature as RegisterNature,
    name: values.name.trim(),
    document: onlyDigits(values.document),
    phone: onlyDigits(values.phone),
    email: values.email.trim().toLowerCase(),
    address: values.address.trim(),
    password: values.password,
    isAdult: true,
  };
}