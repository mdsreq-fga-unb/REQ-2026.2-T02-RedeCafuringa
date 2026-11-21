import { accentInsensitivePattern } from '../../products/domain/product-search.js';
import { buildProducerSearch } from './producer-search.js';

describe('HU36 — busca de produtores (RN15)', () => {
  it('sem termo (ausente ou só espaços) não filtra', () => {
    expect(buildProducerSearch(undefined)).toBeUndefined();
    expect(buildProducerSearch('   ')).toBeUndefined();
  });

  it('procura no nome da iniciativa, na trajetória e nas atividades', () => {
    const match = {
      $regex: accentInsensitivePattern('horta'),
      $options: 'i',
    };
    expect(buildProducerSearch('  horta ')).toEqual({
      $or: [
        { nomeIniciativa: match },
        { trajetoria: match },
        { atividades: match },
      ],
    });
  });

  it('ignora acentos e maiúsculas, como na busca de produtos', () => {
    const filter = buildProducerSearch('CAFÉ');
    const regex = new RegExp(
      (filter?.$or[0].nomeIniciativa as { $regex: string }).$regex,
      'i',
    );
    expect(regex.test('Sítio do cafe')).toBe(true);
    expect(regex.test('Café da Joana')).toBe(true);
    expect(regex.test('Queijaria')).toBe(false);
  });

  it('trata o termo como texto literal (sem regex injetada)', () => {
    const filter = buildProducerSearch('.*');
    const regex = new RegExp(
      (filter?.$or[0].nomeIniciativa as { $regex: string }).$regex,
      'i',
    );
    expect(regex.test('Queijaria')).toBe(false);
  });
});
