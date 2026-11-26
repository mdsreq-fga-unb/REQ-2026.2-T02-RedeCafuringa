import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { load } from 'js-yaml';

/**
 * Deploy numa VPS: o Caddy serve o app e a API no mesmo domínio.
 * `/api/*` vai para a API e o resto para o app (nginx), então o app usa
 * `/api/v1` na própria origem, sem subdomínio nem CORS entre domínios.
 */
function deployFile(name: string): string {
  return readFileSync(
    fileURLToPath(new URL(`../../deploy/${name}`, import.meta.url)),
    'utf8',
  );
}

type Service = {
  build?: { context?: string; target?: string; args?: Record<string, string> };
  restart?: string;
  read_only?: boolean;
  tmpfs?: string[];
  cap_drop?: string[];
  security_opt?: string[];
  mem_limit?: string;
  networks?: string[];
  ports?: string[];
  depends_on?: Record<string, { condition?: string }>;
  environment?: Record<string, string>;
};

const compose = load(deployFile('docker-compose.prod.yml')) as {
  services: Record<string, Service | undefined>;
};
const caddyfile = deployFile('Caddyfile');
const envExample = deployFile('.env.example');

/** Conteúdo entre as chaves do bloco que começa em `opener` (chaves aninhadas contam). */
function block(text: string, opener: string): string {
  const start = text.indexOf(opener);
  if (start < 0) return '';
  let depth = 0;
  for (let i = start + opener.length - 1; i < text.length; i++) {
    if (text[i] === '{') depth++;
    if (text[i] === '}' && --depth === 0)
      return text.slice(start + opener.length, i);
  }
  return '';
}

const site = block(caddyfile, '\n{$APP_DOMAIN} {');
const apiRoute = block(site, 'handle /api/* {');
const appRoute = block(site, 'handle {');

describe('deploy de produção — serviço do app', () => {
  const web = compose.services.web;

  it('constrói a imagem de produção do app com a API na mesma origem', () => {
    expect(web?.build).toEqual({
      context: '../../app',
      target: 'prod',
      args: { VITE_API_URL: '', VITE_USE_MOCK_AUTH: 'false' },
    });
  });

  it('roda com as mesmas restrições dos outros serviços', () => {
    expect(web).toMatchObject({
      restart: 'unless-stopped',
      read_only: true,
      cap_drop: ['ALL'],
      security_opt: ['no-new-privileges:true'],
    });
    // O nginx sem privilégios grava o pid e os temporários em /tmp.
    expect(web?.tmpfs?.some((mount) => mount.startsWith('/tmp'))).toBe(true);
    expect(web?.mem_limit ?? '').toMatch(/^\$\{WEB_MEM_LIMIT:-\d+m\}$/);
  });

  it('fica só na rede do proxy, sem porta pública', () => {
    expect(web?.networks).toEqual(['edge']);
    expect(web?.ports).toBeUndefined();
  });
});

describe('deploy de produção — Caddy na frente do app e da API', () => {
  const caddy = compose.services.caddy;

  it('só sobe depois que o app e a API estão saudáveis', () => {
    expect(caddy?.depends_on).toEqual({
      api: { condition: 'service_healthy' },
      web: { condition: 'service_healthy' },
    });
  });

  it('exige o domínio do app e não usa mais um domínio só da API', () => {
    expect(caddy?.environment?.APP_DOMAIN ?? '').toMatch(/^\$\{APP_DOMAIN:\?/);
    expect(caddy?.environment).not.toHaveProperty('API_DOMAIN');
  });

  it('responde no domínio do app e redireciona o www para ele', () => {
    expect(site).not.toBe('');
    expect(block(caddyfile, 'www.{$APP_DOMAIN} {')).toContain(
      'redir https://{$APP_DOMAIN}{uri} permanent',
    );
  });

  it('manda /api para a API e o resto para o app', () => {
    expect(apiRoute).toContain('reverse_proxy api:3000');
    expect(appRoute).toContain('reverse_proxy web:8080');
    expect(appRoute).not.toContain('api:3000');
  });

  it('mantém as métricas fechadas e o Swagger atrás de senha, dentro da rota da API', () => {
    // `handle` vem antes de `respond` na ordem do Caddy: fora do bloco da API,
    // o 404 das métricas nunca seria aplicado.
    expect(apiRoute).toContain('respond @metrics 404');
    expect(apiRoute).toMatch(/basic_auth @swagger \{/);
  });

  it('os cabeçalhos da API não sobrescrevem a CSP e a Permissions-Policy do app', () => {
    expect(block(apiRoute, 'header {')).toContain('Permissions-Policy');
    expect(appRoute).not.toMatch(
      /Permissions-Policy|Content-Security-Policy|X-Frame-Options/,
    );
    const siteLevel = site.replace(apiRoute, '').replace(appRoute, '');
    expect(siteLevel).not.toContain('Permissions-Policy');
    expect(siteLevel).toContain('Strict-Transport-Security');
  });
});

describe('deploy de produção — exemplo de configuração', () => {
  const value = (name: string) =>
    new RegExp(`^${name}=(.*)$`, 'm').exec(envExample)?.[1];

  it('usa o mesmo domínio para o site, o CORS e os links dos e-mails', () => {
    expect(value('APP_DOMAIN')).toBe('cafuringa.com.br');
    expect(value('CORS_ORIGINS')).toBe('https://cafuringa.com.br');
    expect(value('APP_PUBLIC_URL')).toBe('https://cafuringa.com.br');
    expect(value('API_DOMAIN')).toBeUndefined();
  });
});
