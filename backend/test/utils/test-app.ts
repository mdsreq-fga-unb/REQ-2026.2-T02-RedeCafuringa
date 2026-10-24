import { INestApplication } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { Connection } from 'mongoose';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { inject } from 'vitest';

export interface TestApp {
  app: INestApplication<App>;
  connection: Connection;
  /** Cliente HTTP (Supertest) apontando para a aplicação. */
  request: () => ReturnType<typeof request>;
  /** Apaga os documentos de todas as coleções. Use no beforeEach. */
  clearDatabase: () => Promise<void>;
  /** Remove o banco do arquivo e encerra a aplicação. Use no afterAll. */
  close: () => Promise<void>;
}

/**
 * Cria a aplicação completa (mesma configuração de produção) ligada a um
 * banco exclusivo deste arquivo de teste.
 *
 * Chame uma única vez por arquivo, no beforeAll: o AppModule lê as variáveis
 * de ambiente quando é importado pela primeira vez.
 *
 * @param customize permite substituir providers, por exemplo um serviço de e-mail falso:
 *   `(builder) => builder.overrideProvider(MailService).useValue(fakeMail)`
 */
export async function createTestApp(
  customize: (builder: TestingModuleBuilder) => TestingModuleBuilder = (b) => b,
): Promise<TestApp> {
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = `${inject('mongoUri')}cafuringa-${randomUUID()}`;
  process.env.TRUST_PROXY = '0';
  process.env.LOG_LEVEL = 'silent';

  const { AppModule } = await import('../../src/app.module.js');
  const { configureApp } = await import('../../src/app.setup.js');

  const moduleRef = await customize(
    Test.createTestingModule({ imports: [AppModule] }),
  ).compile();

  const app = moduleRef.createNestApplication<INestApplication<App>>({
    bufferLogs: true,
  });
  configureApp(app);
  await app.init();

  const connection = app.get<Connection>(getConnectionToken());

  return {
    app,
    connection,
    request: () => request(app.getHttpServer()),
    clearDatabase: async () => {
      await Promise.all(
        Object.values(connection.collections).map((collection) =>
          collection.deleteMany({}),
        ),
      );
    },
    close: async () => {
      await connection.dropDatabase();
      await app.close();
    },
  };
}
