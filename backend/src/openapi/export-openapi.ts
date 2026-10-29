import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { generateOpenApiDocument } from './generate-openapi.js';

/**
 * Grava o contrato em shared/openapi.json (fonte única para o front e para a
 * documentação). Uso: npm run openapi:export [-- --out <arquivo>]
 */
const outIndex = process.argv.indexOf('--out');
const out = resolve(
  process.cwd(),
  outIndex > -1 ? process.argv[outIndex + 1] : '../shared/openapi.json',
);

const document = await generateOpenApiDocument();
await mkdir(dirname(out), { recursive: true });
// Saída determinística (chaves na ordem do Nest, 2 espaços, LF e newline final):
// o CI compara o arquivo com git diff.
await writeFile(out, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
console.log(`OpenAPI ${document.info.version}: ${out}`);
