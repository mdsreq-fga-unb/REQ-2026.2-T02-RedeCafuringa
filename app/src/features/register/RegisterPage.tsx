import { useState } from 'react';
import type { FormEvent, InputHTMLAttributes } from 'react';
import { formatCpf } from '@/features/auth/cpf';
import { BackButton } from '../../components/navigation/BackButton';
import { ActionButton } from '../../components/ui/ActionButton';
import { buildRegisterPayload, validateRegisterForm } from './registerForm';
import { registerProducer } from './registerService';
import type { RegisterResult } from './registerService';
import type {
  DocumentType,
  RegisterFormErrors,
  RegisterFormValues,
  RegisterNature,
} from './registerForm';
import { formatCnpj, formatPhone } from './validators';

type RegisterPageProps = {
  onNavigate: (path: string) => void;
};

const NATURES: { value: RegisterNature; label: string }[] = [
  { value: 'producer', label: 'Produtor' },
  { value: 'property', label: 'Propriedade' },
  { value: 'association', label: 'Associação' },
  { value: 'community', label: 'Comunidade' },
];

const INITIAL_VALUES: RegisterFormValues = {
  nature: '',
  documentType: 'cpf',
  name: '',
  document: '',
  phone: '',
  email: '',
  address: '',
  password: '',
  confirmPassword: '',
  isAdult: false,
};

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'value' | 'onChange'> & {
  id: string;
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
};

function TextField({ id, label, value, error, onChange, ...inputProps }: TextFieldProps) {
  return (
    <>
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <input
        {...inputProps}
        id={id}
        className="text-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </>
  );
}

type RegisterFailure = Extract<RegisterResult, { ok: false }>;

function rateLimitMessage(seconds?: number) {
  if (seconds === undefined) return 'Muitas tentativas. Tente novamente em instantes.';
  return `Muitas tentativas. Tente novamente em ${seconds} ${seconds === 1 ? 'segundo' : 'segundos'}.`;
}

function FailureAlert({
  failure,
  onGoToLogin,
}: {
  failure: RegisterFailure;
  onGoToLogin: () => void;
}) {
  switch (failure.reason) {
    case 'duplicate':
      return (
        <>
          <p className="form-alert" role="alert">
            CPF/CNPJ ou e-mail já cadastrado. Entre na sua conta ou recupere o acesso.
          </p>
          <ActionButton variant="orange" type="button" onClick={onGoToLogin}>
            Ir para o login
          </ActionButton>
        </>
      );
    case 'invalid':
      return (
        <div className="form-alert" role="alert">
          <p>Confira os dados informados:</p>
          <ul>
            {failure.messages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      );
    case 'rate_limit':
      return (
        <p className="form-alert" role="alert">
          {rateLimitMessage(failure.retryAfterSeconds)}
        </p>
      );
    case 'error':
      return (
        <p className="form-alert" role="alert">
          Não foi possível concluir o cadastro agora. Tente novamente em instantes.
        </p>
      );
  }
}

export function RegisterPage({ onNavigate }: RegisterPageProps) {
  const [values, setValues] = useState<RegisterFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<RegisterFailure | null>(null);

  const isCnpj = values.documentType === 'cnpj';
  const formatDocument = isCnpj ? formatCnpj : formatCpf;

  const setField = <K extends keyof RegisterFormValues>(
    field: K,
    value: RegisterFormValues[K],
  ) => setValues((current) => ({ ...current, [field]: value }));

  const changeDocumentType = (type: DocumentType) =>
    setValues((current) => ({ ...current, documentType: type, document: '' }));

      const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFailure(null);

    const validationErrors = validateRegisterForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    let result: RegisterResult;
    try {
      result = await registerProducer(buildRegisterPayload(values));
    } catch {
      result = { ok: false, reason: 'error' };
    }

    if (result.ok) {
      onNavigate('/entrar?cadastro=ok');
      return;
    }

    setFailure(result);
    setLoading(false);
  };

  return (
    <section className="login-page register-page">
      <BackButton label="Voltar" onClick={() => onNavigate('/entrar')} />
      <h1>Cadastre seu perfil</h1>
      <p className="body-copy">Divulgue sua produção, seus produtos e suas experiências.</p>

      <form className="login-form" onSubmit={handleSubmit} noValidate>
        <fieldset
          className="choice-group"
          aria-describedby={errors.nature ? 'register-nature-error' : undefined}
        >
            {failure && <FailureAlert failure={failure} onGoToLogin={() => onNavigate('/entrar')} />}
          <legend className="field-label">Natureza do cadastro</legend>
          {NATURES.map(({ value, label }) => (
            <label key={value} className="choice-option">
              <input
                type="radio"
                name="nature"
                value={value}
                checked={values.nature === value}
                onChange={() => setField('nature', value)}
              />
              {label}
            </label>
          ))}
          {errors.nature && (
            <p id="register-nature-error" className="field-error">
              {errors.nature}
            </p>
          )}
        </fieldset>

        <TextField
          id="register-name"
          label="Nome"
          type="text"
          autoComplete="name"
          value={values.name}
          error={errors.name}
          onChange={(value) => setField('name', value)}
        />

        <fieldset className="choice-group">
          <legend className="field-label">Tipo de documento</legend>
          <label className="choice-option">
            <input
              type="radio"
              name="documentType"
              value="cpf"
              checked={!isCnpj}
              onChange={() => changeDocumentType('cpf')}
            />
            Pessoa física (CPF)
          </label>
          <label className="choice-option">
            <input
              type="radio"
              name="documentType"
              value="cnpj"
              checked={isCnpj}
              onChange={() => changeDocumentType('cnpj')}
            />
            Pessoa jurídica (CNPJ)
          </label>
        </fieldset>

        <TextField
          id="register-document"
          label={isCnpj ? 'CNPJ' : 'CPF'}
          type="text"
          inputMode="numeric"
          placeholder={isCnpj ? '00.000.000/0000-00' : '000.000.000-00'}
          value={values.document}
          error={errors.document}
          onChange={(value) => setField('document', formatDocument(value))}
        />

        <TextField
          id="register-phone"
          label="Telefone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(00) 00000-0000"
          value={values.phone}
          error={errors.phone}
          onChange={(value) => setField('phone', formatPhone(value))}
        />

        <TextField
          id="register-email"
          label="E-mail"
          type="email"
          autoComplete="email"
          value={values.email}
          error={errors.email}
          onChange={(value) => setField('email', value)}
        />

        <TextField
          id="register-address"
          label="Endereço"
          type="text"
          autoComplete="street-address"
          value={values.address}
          error={errors.address}
          onChange={(value) => setField('address', value)}
        />

        <TextField
          id="register-password"
          label="Senha"
          type="password"
          autoComplete="new-password"
          value={values.password}
          error={errors.password}
          onChange={(value) => setField('password', value)}
        />

        <TextField
          id="register-confirm-password"
          label="Confirmar senha"
          type="password"
          autoComplete="new-password"
          value={values.confirmPassword}
          error={errors.confirmPassword}
          onChange={(value) => setField('confirmPassword', value)}
        />

        <label className="choice-option">
          <input
            type="checkbox"
            name="isAdult"
            checked={values.isAdult}
            onChange={(event) => setField('isAdult', event.target.checked)}
            aria-invalid={Boolean(errors.isAdult)}
            aria-describedby={errors.isAdult ? 'register-adult-error' : undefined}
          />
          Declaro que sou maior de 18 anos
        </label>
        {errors.isAdult && (
          <p id="register-adult-error" className="field-error">
            {errors.isAdult}
          </p>
        )}

        <div className="login-actions">
          <ActionButton variant="orange" type="submit" disabled={loading}>
            {loading ? 'Criando conta…' : 'Criar conta'}
          </ActionButton>
        </div>
      </form>
    </section>
  );
}