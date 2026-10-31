import { MongoMemoryServer } from 'mongodb-memory-server';
import type { TestProject } from 'vitest/node';

declare module 'vitest' {
  export interface ProvidedContext {
    mongoUri: string;
  }
}

/**
 * Sobe um único MongoDB em memória para toda a execução dos testes e2e.
 * Cada arquivo de teste usa um banco próprio dentro dele (ver createTestApp),
 * então os arquivos podem rodar em paralelo sem interferir uns nos outros.
 */
export default async function setup(project: TestProject) {
  const mongo = await MongoMemoryServer.create();
  project.provide('mongoUri', mongo.getUri());

  return async () => {
    await mongo.stop();
  };
}
