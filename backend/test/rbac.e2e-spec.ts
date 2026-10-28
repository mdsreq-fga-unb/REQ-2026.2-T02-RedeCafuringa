process.env.AUTH_THROTTLE_LIMIT = '1000';

import { Role } from '../src/modules/users/domain/role.js';
import { RolesProbeModule } from './support/roles-probe.module.js';
import { loginAs } from './utils/auth.js';
import { createTestApp, TestApp } from './utils/test-app.js';

const PROBE = '/api/v1/__probe';

describe('RN01/RNF08 — Controle de acesso por perfil (e2e)', () => {
  let t: TestApp;
  const tokens = {} as Record<Role, string>;

  beforeAll(async () => {
    t = await createTestApp(undefined, { imports: [RolesProbeModule] });
    for (const perfil of Object.values(Role)) {
      tokens[perfil] = await loginAs(t, perfil);
    }
  });

  afterAll(async () => {
    await t?.close();
  });

  function get(path: string, perfil?: Role) {
    const request = t.request().get(`${PROBE}/${path}`);
    return perfil
      ? request.set('Authorization', `Bearer ${tokens[perfil]}`)
      : request;
  }

  it('rota @Public() responde sem login', async () => {
    await get('public').expect(200);
  });

  it('negação por padrão: rota sem decorator exige login (401)', async () => {
    await get('authenticated').expect(401);
  });

  it('rota autenticada recebe o usuário do token', async () => {
    const response = await get('authenticated', Role.CONSUMIDOR).expect(200);

    expect(response.body).toEqual({
      id: expect.any(String),
      perfil: 'CONSUMIDOR',
    });
  });

  describe('funcionalidade exclusiva de produtor', () => {
    it('401 sem login', async () => {
      await get('producer').expect(401);
    });

    it('RNF08: 403 para consumidor, inclusive por acesso direto ao endpoint', async () => {
      const response = await get('producer', Role.CONSUMIDOR).expect(403);

      expect(response.body.message).toBe(
        'Seu perfil não tem permissão para acessar este recurso',
      );
    });

    it('403 para administrador (permissões são explícitas, sem hierarquia)', async () => {
      await get('producer', Role.ADMINISTRADOR).expect(403);
    });

    it('200 para produtor', async () => {
      await get('producer', Role.PRODUTOR).expect(200);
    });
  });

  describe('RN04: funcionalidade exclusiva de administrador', () => {
    it.each([Role.CONSUMIDOR, Role.PRODUTOR])('403 para %s', async (perfil) => {
      await get('admin', perfil).expect(403);
    });

    it('200 para administrador', async () => {
      await get('admin', Role.ADMINISTRADOR).expect(200);
    });
  });

  describe('rota com mais de um perfil', () => {
    it.each([Role.PRODUTOR, Role.ADMINISTRADOR])(
      '200 para %s',
      async (perfil) => {
        await get('producer-or-admin', perfil).expect(200);
      },
    );

    it('403 para consumidor', async () => {
      await get('producer-or-admin', Role.CONSUMIDOR).expect(403);
    });
  });

  it('rotas de infraestrutura continuam públicas', async () => {
    await t.request().get('/api/v1/health/live').expect(200);
    await t.request().get('/api/v1/metrics').expect(200);
  });
});
