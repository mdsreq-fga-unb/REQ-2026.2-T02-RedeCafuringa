const ADULT_AGE = 18;

/**
 * RN15 / RNF15: no MVP só maiores de 18 anos se cadastram, o que dispensa o
 * fluxo de consentimento do responsável legal (D10). Compara em UTC para não
 * depender do fuso do servidor.
 */
export function isAdult(birthDate: Date, today: Date = new Date()): boolean {
  if (Number.isNaN(birthDate.getTime()) || birthDate > today) return false;

  const adulthood = new Date(birthDate);
  adulthood.setUTCFullYear(birthDate.getUTCFullYear() + ADULT_AGE);

  return adulthood <= today;
}
