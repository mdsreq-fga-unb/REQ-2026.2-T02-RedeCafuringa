import { buildResetEmail } from './reset-email.js';

const link =
  'https://app.cafuringa.example/nova-senha?token=abcDEF_-0123456789abcDEF_-0123456789abc';

describe('HU10/CA03 — e-mail de recuperação de acesso', () => {
  const email = buildResetEmail({ link, ttlMinutes: 30 });

  it('tem assunto orientativo e sem dados pessoais', () => {
    expect(email.subject).toBe('Recuperação de acesso — Rede Cafuringa');
  });

  it('traz o link de redefinição em texto e em HTML', () => {
    expect(email.text).toContain(link);
    expect(email.html).toContain(`href="${link}"`);
  });

  it('informa a validade do link', () => {
    expect(email.text).toContain('30 minutos');
    expect(email.html).toContain('30 minutos');
  });

  it('orienta quem não pediu a recuperação (RNF03)', () => {
    expect(email.text).toMatch(/não (foi você|solicitou)/i);
    expect(email.text).toMatch(/ignore/i);
  });

  it('usa singular para 1 minuto', () => {
    const um = buildResetEmail({ link, ttlMinutes: 1 });
    expect(um.text).toContain('1 minuto.');
  });

  it('escapa HTML do link para não permitir injeção', () => {
    const hostil = buildResetEmail({
      link: 'https://x.com/?a="><script>alert(1)</script>',
      ttlMinutes: 30,
    });

    expect(hostil.html).not.toContain('<script>');
    expect(hostil.html).toContain('&lt;script&gt;');
  });
});
