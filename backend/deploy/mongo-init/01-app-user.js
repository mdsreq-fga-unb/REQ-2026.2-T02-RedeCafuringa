/*
 * Executado pelo entrypoint oficial do MongoDB apenas na primeira
 * inicialização de um volume vazio (/docker-entrypoint-initdb.d).
 *
 * Cria um usuário de aplicação com readWrite somente no banco da aplicação.
 * O root continua existindo apenas para administração/backup.
 *
 * Para um volume que já existe, crie o usuário manualmente (ver
 * deploy/backup/README.md) ou recrie o volume em ambiente descartável.
 */
const database = process.env.MONGO_INITDB_DATABASE || 'cafuringa';
const user = process.env.MONGO_APP_USER;
const password = process.env.MONGO_APP_PASSWORD;

if (!user || !password) {
  throw new Error('MONGO_APP_USER e MONGO_APP_PASSWORD são obrigatórios');
}

const appDb = db.getSiblingDB(database);

if (!appDb.getUser(user)) {
  appDb.createUser({
    user,
    pwd: password,
    roles: [{ role: 'readWrite', db: database }],
  });
}
