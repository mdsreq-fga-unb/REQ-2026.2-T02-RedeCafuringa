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
  },
});
