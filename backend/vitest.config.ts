import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Resolves the path aliases declared in tsconfig.json, including the ones
  // added by `nest g library`. Requires Vite 8, which ships this option.
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // Cobertura cobrada sobre as regras de negócio, que são testadas por
      // testes unitários. Controllers e módulos são cobertos pelos testes e2e.
      include: [
        'src/**/*.service.ts',
        'src/**/*.guard.ts',
        'src/**/*.policy.ts',
        'src/**/domain/**/*.ts',
        'src/common/**/*.ts',
      ],
      exclude: ['src/**/*.spec.ts', 'src/**/*.module.ts', 'src/**/*.dto.ts'],
      // perFile: cada arquivo precisa atingir o mínimo, não só a média do projeto.
      thresholds: {
        perFile: true,
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
