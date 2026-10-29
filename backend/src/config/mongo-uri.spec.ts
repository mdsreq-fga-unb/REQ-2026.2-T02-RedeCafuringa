import type { ConfigService } from '@nestjs/config';
import { resolveMongoUri } from './mongo-uri.js';

function makeConfig(values: Record<string, string>): ConfigService {
  return {
    get: (key: string, defaultValue?: unknown) => values[key] ?? defaultValue,
  } as unknown as ConfigService;
}

describe('resolveMongoUri', () => {
  it('usa MONGODB_URI quando ela existe', () => {
    const uri = resolveMongoUri(
      makeConfig({ MONGODB_URI: 'mongodb://localhost:27017/cafuringa' }),
    );

    expect(uri).toBe('mongodb://localhost:27017/cafuringa');
  });

  it('monta a URI com encodeURIComponent nos componentes', () => {
    const uri = resolveMongoUri(
      makeConfig({
        MONGODB_HOST: 'mongo:27017',
        MONGODB_DB: 'cafuringa',
        MONGODB_USER: 'app',
        MONGODB_PASSWORD: 'p@ss:/?#',
        MONGODB_AUTH_SOURCE: 'cafuringa',
      }),
    );

    expect(uri).toBe(
      'mongodb://app:p%40ss%3A%2F%3F%23@mongo:27017/cafuringa?authSource=cafuringa',
    );
  });

  it('falha quando não há URI nem usuário/senha', () => {
    expect(() => resolveMongoUri(makeConfig({}))).toThrow(
      'MONGODB_URI ou o par MONGODB_USER/MONGODB_PASSWORD',
    );
  });
});
