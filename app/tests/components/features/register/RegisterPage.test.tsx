import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RegisterPage } from '@/features/register/RegisterPage';

function renderRegister() {
  const onNavigate = vi.fn();
  render(<RegisterPage onNavigate={onNavigate} />);
  return { onNavigate, user: userEvent.setup() };
}

afterEach(() => {
  cleanup();
});

describe('RegisterPage — HU02 Cadastrar perfil de produtor', () => {
  it('mostra o título e leva de volta ao login pelo botão Voltar', async () => {
    const { onNavigate, user } = renderRegister();

    expect(screen.getByRole('heading', { name: 'Cadastre seu perfil' })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /Voltar/ }));
    expect(onNavigate).toHaveBeenCalledWith('/entrar');
  });

  // CA02
  it('oferece as quatro naturezas de cadastro', () => {
    renderRegister();

    expect(screen.getByRole('group', { name: 'Natureza do cadastro' })).toBeTruthy();
    for (const label of ['Produtor', 'Propriedade', 'Associação', 'Comunidade']) {
      expect(screen.getByRole('radio', { name: label })).toBeTruthy();
    }
  });

  // CA03
  it('mostra os campos exigidos e o botão de criar conta', () => {
    renderRegister();

    for (const label of [
      'Nome',
      'CPF',
      'Telefone',
      'E-mail',
      'Endereço',
      'Senha',
      'Confirmar senha',
    ]) {
      expect(screen.getByLabelText(label)).toBeTruthy();
    }
    expect(screen.getByRole('button', { name: 'Criar conta' })).toBeTruthy();
  });

  it('começa com CPF e troca o campo de documento para CNPJ ao escolher esse tipo', async () => {
    const { user } = renderRegister();

    const cpfOption = screen.getByRole('radio', { name: 'Pessoa física (CPF)' }) as HTMLInputElement;
    expect(cpfOption.checked).toBe(true);

    await user.click(screen.getByRole('radio', { name: 'Pessoa jurídica (CNPJ)' }));

    expect(screen.getByLabelText('CNPJ')).toBeTruthy();
    expect(screen.queryByLabelText('CPF')).toBeNull();
  });

  // CA07
  it('pede a confirmação de maioridade por uma caixa de seleção', () => {
    renderRegister();

    expect(
      screen.getByRole('checkbox', { name: 'Declaro que sou maior de 18 anos' }),
    ).toBeTruthy();
  });
});