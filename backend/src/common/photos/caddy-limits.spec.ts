import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  maxRequestBytes,
  PHOTO_GALLERY_POLICIES,
  PhotoOwnerType,
} from './photo-gallery.policy.js';

const caddyfile = readFileSync(
  fileURLToPath(new URL('../../../deploy/Caddyfile', import.meta.url)),
  'utf8',
);

/** `max_size` do bloco `request_body @<matcher>`, em MB. */
function caddyLimitMb(matcher: string): number | undefined {
  const block = new RegExp(
    `request_body @${matcher} \\{[^}]*?max_size (\\d+)MB`,
  ).exec(caddyfile);
  return block ? Number(block[1]) : undefined;
}

describe('Caddy acompanha as políticas de galeria', () => {
  // Se a política mudar e o proxy não, produção recusa o envio com 413 antes
  // de chegar à API (o teste local não pega, porque não passa pelo Caddy).
  it('POST /products aceita o maior envio que a política do produto permite', () => {
    const policy = PHOTO_GALLERY_POLICIES[PhotoOwnerType.PRODUTO];
    expect(caddyLimitMb('productUpload')).toBe(
      Math.ceil(maxRequestBytes(policy) / (1024 * 1024)),
    );
  });
});
