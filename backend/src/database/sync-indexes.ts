import type { Connection } from 'mongoose';

/**
 * Alinha os índices do banco aos schemas: cria os que faltam e troca os que
 * mudaram de opções (ex.: `cpfHash` único que passou a ser esparso na HU03).
 *
 * Em produção o Mongoose não cria índices no boot (`autoIndex` desligado), então
 * rode `npm run db:sync-indexes` a cada deploy que mexa em índices. É idempotente.
 */
export async function syncIndexes(connection: Connection): Promise<void> {
  for (const model of Object.values(connection.models)) {
    await model.syncIndexes();
  }
}
