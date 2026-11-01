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

  if (!values.nature) errors.nature = 'Escolha a natureza do cadastro.';
  if (!values.name.trim()) errors.name = 'Informe o nome.';
  if (!values.document.trim()) {
    errors.document = values.documentType === 'cnpj' ? 'Informe o CNPJ.' : 'Informe o CPF.';
  }
  if (!values.phone.trim()) errors.phone = 'Informe o telefone.';
  if (!values.email.trim()) errors.email = 'Informe o e-mail.';
  if (!values.address.trim()) errors.address = 'Informe o endereço.';
  if (!values.password) errors.password = 'Informe a senha.';
  if (!values.confirmPassword) errors.confirmPassword = 'Confirme a senha.';
  if (!values.isAdult) errors.isAdult = 'Confirme que você é maior de 18 anos.';

  return errors;
}