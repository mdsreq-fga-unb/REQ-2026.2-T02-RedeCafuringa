import { Role } from '../../users/domain/role.js';
import { isSessionValid } from './session.js';

const ativo = { ativo: true, perfil: Role.CONSUMIDOR };
// O `iat` do JWT é em segundos inteiros: a fração (.700) da troca é descartada.
const CHANGE = new Date('2026-11-06T12:00:00.700Z');
const CHANGE_S = Math.floor(CHANGE.getTime() / 1000);

describe('Revogação de sessão (HU10, RNF08)', () => {
  it('conta ativa, mesmo perfil e sem troca de senha: válida', () => {
    expect(isSessionValid({ iat: 100, perfil: Role.CONSUMIDOR }, ativo)).toBe(
      true,
    );
  });

  it('conta inexistente: inválida', () => {
    expect(isSessionValid({ iat: 100, perfil: Role.CONSUMIDOR }, null)).toBe(
      false,
    );
  });

  it('conta desativada: inválida mesmo com token dentro da validade', () => {
    expect(
      isSessionValid(
        { iat: 100, perfil: Role.CONSUMIDOR },
        { ...ativo, ativo: false },
      ),
    ).toBe(false);
  });

  it('perfil mudou desde a emissão do token: inválida', () => {
    expect(
      isSessionValid({ iat: 100, perfil: Role.ADMINISTRADOR }, ativo),
    ).toBe(false);
  });

  it('token emitido antes da troca de senha: inválido', () => {
    expect(
      isSessionValid(
        { iat: CHANGE_S - 1, perfil: Role.CONSUMIDOR },
        { ...ativo, credenciaisAlteradasEm: CHANGE },
      ),
    ).toBe(false);
  });

  describe('sat: instante do login em milissegundos (fecha a janela de 1 s do iat)', () => {
    it('login no mesmo segundo, mas antes da troca: inválido', () => {
      expect(
        isSessionValid(
          {
            iat: CHANGE_S,
            sat: CHANGE.getTime() - 300,
            perfil: Role.CONSUMIDOR,
          },
          { ...ativo, credenciaisAlteradasEm: CHANGE },
        ),
      ).toBe(false);
    });

    it('login no mesmo segundo, logo depois da troca: válido', () => {
      expect(
        isSessionValid(
          {
            iat: CHANGE_S,
            sat: CHANGE.getTime() + 100,
            perfil: Role.CONSUMIDOR,
          },
          { ...ativo, credenciaisAlteradasEm: CHANGE },
        ),
      ).toBe(true);
    });

    it('sat prevalece sobre o iat', () => {
      expect(
        isSessionValid(
          {
            iat: CHANGE_S + 60,
            sat: CHANGE.getTime() - 1,
            perfil: Role.CONSUMIDOR,
          },
          { ...ativo, credenciaisAlteradasEm: CHANGE },
        ),
      ).toBe(false);
    });

    it('token sem sat (emitido antes desta versão) no mesmo segundo da troca: inválido (na dúvida, encerra)', () => {
      expect(
        isSessionValid(
          { iat: CHANGE_S, perfil: Role.CONSUMIDOR },
          { ...ativo, credenciaisAlteradasEm: CHANGE },
        ),
      ).toBe(false);
    });
  });

  it('token emitido depois da troca: válido', () => {
    expect(
      isSessionValid(
        { iat: CHANGE_S + 60, perfil: Role.CONSUMIDOR },
        { ...ativo, credenciaisAlteradasEm: CHANGE },
      ),
    ).toBe(true);
  });

  it('token sem iat, com troca de senha registrada: inválido (não dá para provar que é posterior)', () => {
    expect(
      isSessionValid(
        { perfil: Role.CONSUMIDOR },
        { ...ativo, credenciaisAlteradasEm: CHANGE },
      ),
    ).toBe(false);
  });

  it('token sem iat e conta sem troca de senha: válido', () => {
    expect(isSessionValid({ perfil: Role.CONSUMIDOR }, ativo)).toBe(true);
  });
});
