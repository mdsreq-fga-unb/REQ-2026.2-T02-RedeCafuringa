import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['test/**/*.e2e-spec.ts'],
    globalSetup: ['./test/setup/mongo.global-setup.ts'],
    // Na primeira execução o mongodb-memory-server baixa o binário do MongoDB.
    hookTimeout: 120_000,
    // Login usa argon2id e vários testes fazem muitas requisições em sequência:
    // com a máquina ocupada, 5 s (padrão) estoura e o teste falha sem defeito real.
    testTimeout: 30_000,
  },
});
