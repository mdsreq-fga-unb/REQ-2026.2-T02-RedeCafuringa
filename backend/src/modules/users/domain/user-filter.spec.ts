import { Role } from './role.js';
import { buildUserFilter, escapeRegex } from './user-filter.js';

describe('HU04 — filtro da consulta de usuários', () => {
  it('CA09: sem critérios, consulta todos os perfis', () => {
    expect(buildUserFilter({})).toEqual({});
  });

  it.each([Role.CONSUMIDOR, Role.PRODUTOR, Role.ADMINISTRADOR])(
    'CA02/CA03/CA04: filtra pelo perfil %s',
    (perfil) => {
      expect(buildUserFilter({ perfil })).toEqual({ perfil });
    },
  );

  it('busca por nome, e-mail ou iniciativa sem diferenciar maiúsculas', () => {
    const filter = buildUserFilter({ busca: 'Maria' });

    expect(filter.$or).toEqual([
      { nome: { $regex: 'Maria', $options: 'i' } },
      { email: { $regex: 'Maria', $options: 'i' } },
      { nomeIniciativa: { $regex: 'Maria', $options: 'i' } },
    ]);
  });

  it('combina perfil e busca', () => {
    expect(
      buildUserFilter({ perfil: Role.PRODUTOR, busca: 'horta' }),
    ).toMatchObject({ perfil: Role.PRODUTOR, $or: expect.any(Array) });
  });

  it('ignora busca em branco', () => {
    expect(buildUserFilter({ busca: '   ' })).toEqual({});
  });

  it('remove espaços nas pontas do termo', () => {
    const filter = buildUserFilter({ busca: '  ana ' });

    expect(filter.$or?.[0]).toEqual({
      nome: { $regex: 'ana', $options: 'i' },
    });
  });

  it('RNF03: trata caracteres especiais da busca como texto literal', () => {
    const filter = buildUserFilter({ busca: 'a.b*(c' });

    expect(filter.$or?.[0]).toEqual({
      nome: { $regex: 'a\\.b\\*\\(c', $options: 'i' },
    });
  });
});

describe('escapeRegex', () => {
  it('escapa todos os metacaracteres de expressão regular', () => {
    const special = '.*+?^${}()|[]\\';
    const escaped = escapeRegex(special);

    expect(new RegExp(`^${escaped}$`).test(special)).toBe(true);
  });

  it('mantém texto comum intacto', () => {
    expect(escapeRegex('Sítio Boa Vista')).toBe('Sítio Boa Vista');
  });
});
