import { describe, expect, it } from 'vitest';
import {
  validateRegisterForm,
  type RegisterFormValues,
} from '@/features/register/registerForm';

const validForm: RegisterFormValues = {
  nature: 'producer',
  documentType: 'cpf',
  name: 'Maria da Silva',
  document: '529.982.247-25',
  phone: '(61) 91234-5678',
  email: 'maria@exemplo.com',
  address: 'Chácara 12, Núcleo Rural, Brasília - DF',
  password: 'senha-segura-1',
  confirmPassword: 'senha-segura-1',
  isAdult: true,
};

describe('validateRegisterForm: campos obrigatórios', () => {
  it('não retorna erros para um formulário válido', () => {
    expect(validateRegisterForm(validForm)).toEqual({});
  });

  it('sinaliza todos os campos obrigatórios vazios', () => {
    const empty: RegisterFormValues = {
      ...validForm,
      nature: '',
      name: '',
      document: '',
      phone: '',
      email: '',
      address: '',
      password: '',
      confirmPassword: '',
      isAdult: false,
    };

    expect(validateRegisterForm(empty)).toEqual({
      nature: 'Escolha a natureza do cadastro.',
      name: 'Informe o nome.',
      document: 'Informe o CPF.',
      phone: 'Informe o telefone.',
      email: 'Informe o e-mail.',
      address: 'Informe o endereço.',
      password: 'Informe a senha.',
      confirmPassword: 'Confirme a senha.',
      isAdult: 'Confirme que você é maior de 18 anos.',
    });
  });

  it('pede CNPJ quando o tipo de documento escolhido é CNPJ', () => {
    const errors = validateRegisterForm({ ...validForm, documentType: 'cnpj', document: '' });
    expect(errors.document).toBe('Informe o CNPJ.');
  });

  it('trata campos só com espaços como vazios', () => {
    const errors = validateRegisterForm({ ...validForm, name: '   ', address: '  ' });
    expect(errors).toMatchObject({
      name: 'Informe o nome.',
      address: 'Informe o endereço.',
    });
  });
});