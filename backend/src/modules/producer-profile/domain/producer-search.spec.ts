import { accentInsensitivePattern } from '../../products/domain/product-search.js';
import { buildProducerSearch } from './producer-search.js';

/** Regex do campo `nomeIniciativa` do filtro gerado para o termo. */
function nameRegex(busca: string): RegExp {
  const filter = buildProducerSearch(busca);
  if (!filter) throw new Error('o termo deveria gerar um filtro');
  const { $regex } = filter.$or[0].nomeIniciativa;
  return new RegExp($regex, 'i');
}

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
    const regex = nameRegex('CAFÉ');
    expect(regex.test('Sítio do cafe')).toBe(true);
    expect(regex.test('Café da Joana')).toBe(true);
    expect(regex.test('Queijaria')).toBe(false);
  });

  it('trata o termo como texto literal (sem regex injetada)', () => {
    const regex = nameRegex('.*');
    expect(regex.test('Queijaria')).toBe(false);
  });
});
