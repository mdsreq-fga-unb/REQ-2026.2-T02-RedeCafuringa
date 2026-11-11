import type { ConfigService } from '@nestjs/config';

/**
 * Resolve a URI do MongoDB a partir de MONGODB_URI (dev/test) ou de
 * componentes separados (produção). A montagem com encodeURIComponent evita
 * que senhas com @, :, /, ? ou # quebrem a URI.
 */
export function resolveMongoUri(config: ConfigService): string {
  const uri = config.get<string>('MONGODB_URI');
  if (uri) {
    return uri;
  }

  const host = config.get<string>('MONGODB_HOST', 'mongo:27017');
  const database = config.get<string>('MONGODB_DB', 'cafuringa');
  const user = config.get<string>('MONGODB_USER');
  const password = config.get<string>('MONGODB_PASSWORD');

  if (!user || !password) {
    throw new Error(
      'Defina MONGODB_URI ou o par MONGODB_USER/MONGODB_PASSWORD para conectar ao MongoDB.',
    );
  }

  const authSource = config.get<string>('MONGODB_AUTH_SOURCE', database);

  return `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}/${encodeURIComponent(database)}?authSource=${encodeURIComponent(authSource)}`;
}
