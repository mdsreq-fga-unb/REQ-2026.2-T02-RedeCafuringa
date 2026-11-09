export interface ResetEmail {
  subject: string;
  text: string;
  html: string;
}

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

function minutesLabel(minutes: number): string {
  return minutes === 1 ? '1 minuto' : `${minutes} minutos`;
}

/**
 * Texto do e-mail de recuperação (CA03). Não cita nome, CPF nem qualquer dado
 * pessoal (RNF11): a única informação é o link de uso único.
 */
export function buildResetEmail(params: {
  link: string;
  ttlMinutes: number;
}): ResetEmail {
  const validade = minutesLabel(params.ttlMinutes);
  const link = escapeHtml(params.link);

  const text = [
    'Recebemos um pedido para redefinir a senha da sua conta na Rede Cafuringa.',
    '',
    `Para criar uma nova senha, abra o link: ${params.link}`,
    '',
    `Este link vale por ${validade}.`,
    '',
    'Se não foi você quem solicitou, ignore este e-mail: sua senha continua a mesma.',
  ].join('\n');

  const html = [
    '<p>Recebemos um pedido para redefinir a senha da sua conta na Rede Cafuringa.</p>',
    `<p><a href="${link}">Criar uma nova senha</a></p>`,
    `<p>Este link vale por ${validade}.</p>`,
    '<p>Se não foi você quem solicitou, ignore este e-mail: sua senha continua a mesma.</p>',
  ].join('\n');

  return {
    subject: 'Recuperação de acesso — Rede Cafuringa',
    text,
    html,
  };
}
