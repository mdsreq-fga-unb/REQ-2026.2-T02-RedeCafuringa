import { useState } from 'react';
import { BackButton } from '../../components/navigation/BackButton';
import { ActionButton } from '../../components/ui/ActionButton';
import type { DocumentType, RegisterNature } from './registerForm';

type RegisterPageProps = {
  onNavigate: (path: string) => void;
};

const NATURES: { value: RegisterNature; label: string }[] = [
  { value: 'producer', label: 'Produtor' },
  { value: 'property', label: 'Propriedade' },
  { value: 'association', label: 'Associação' },
  { value: 'community', label: 'Comunidade' },
];

export function RegisterPage({ onNavigate }: RegisterPageProps) {
  const [documentType, setDocumentType] = useState<DocumentType>('cpf');
  const documentLabel = documentType === 'cnpj' ? 'CNPJ' : 'CPF';

  return (
    <section className="login-page register-page">
      <BackButton label="Voltar" onClick={() => onNavigate('/entrar')} />
      <h1>Cadastre seu perfil</h1>
      <p className="body-copy">Divulgue sua produção, seus produtos e suas experiências.</p>

      <form className="login-form" noValidate>
        <fieldset className="choice-group">
          <legend className="field-label">Natureza do cadastro</legend>
          {NATURES.map(({ value, label }) => (
            <label key={value} className="choice-option">
              <input type="radio" name="nature" value={value} />
              {label}
            </label>
          ))}
        </fieldset>

        <label className="field-label" htmlFor="register-name">
          Nome
        </label>
        <input id="register-name" className="text-input" type="text" autoComplete="name" />

        <fieldset className="choice-group">
          <legend className="field-label">Tipo de documento</legend>
          <label className="choice-option">
            <input
              type="radio"
              name="documentType"
              value="cpf"
              checked={documentType === 'cpf'}
              onChange={() => setDocumentType('cpf')}
            />
            Pessoa física (CPF)
          </label>
          <label className="choice-option">
            <input
              type="radio"
              name="documentType"
              value="cnpj"
              checked={documentType === 'cnpj'}
              onChange={() => setDocumentType('cnpj')}
            />
            Pessoa jurídica (CNPJ)
          </label>
        </fieldset>

        <label className="field-label" htmlFor="register-document">
          {documentLabel}
        </label>
        <input
          id="register-document"
          className="text-input"
          type="text"
          inputMode="numeric"
          placeholder={documentType === 'cnpj' ? '00.000.000/0000-00' : '000.000.000-00'}
        />

        <label className="field-label" htmlFor="register-phone">
          Telefone
        </label>
        <input
          id="register-phone"
          className="text-input"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(00) 00000-0000"
        />

        <label className="field-label" htmlFor="register-email">
          E-mail
        </label>
        <input
          id="register-email"
          className="text-input"
          type="email"
          autoComplete="email"
        />

        <label className="field-label" htmlFor="register-address">
          Endereço
        </label>
        <input
          id="register-address"
          className="text-input"
          type="text"
          autoComplete="street-address"
        />

        <label className="field-label" htmlFor="register-password">
          Senha
        </label>
        <input
          id="register-password"
          className="text-input"
          type="password"
          autoComplete="new-password"
        />

        <label className="field-label" htmlFor="register-confirm-password">
          Confirmar senha
        </label>
        <input
          id="register-confirm-password"
          className="text-input"
          type="password"
          autoComplete="new-password"
        />

        <label className="choice-option">
          <input type="checkbox" name="isAdult" />
          Declaro que sou maior de 18 anos
        </label>

        <div className="login-actions">
          <ActionButton variant="orange" type="submit">
            Criar conta
          </ActionButton>
        </div>
      </form>
    </section>
  );
}