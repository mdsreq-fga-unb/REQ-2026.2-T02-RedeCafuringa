import { NestFactory } from '@nestjs/core';
import { getConnectionToken } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';
import { AppModule } from '../app.module.js';
import { syncIndexes } from './sync-indexes.js';

/** Entrada de `npm run db:sync-indexes`: usa as mesmas variáveis de ambiente da API. */
async function main(): Promise<void> {
  // Sem HTTP: só o contexto da aplicação, para ler a configuração e conectar.
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  try {
    await syncIndexes(app.get<Connection>(getConnectionToken()));
    console.log('Índices sincronizados.');
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
