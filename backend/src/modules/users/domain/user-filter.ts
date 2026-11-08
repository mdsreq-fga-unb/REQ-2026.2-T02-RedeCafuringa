import type { Role } from './role.js';

export type UserSearchCriteria = { perfil?: Role; busca?: string };

type TextMatch = { $regex: string; $options: 'i' };

export type UserFilter = {
  perfil?: Role;
  $or?: Array<Record<string, TextMatch>>;
};

/** Campos em que a busca da consulta administrativa procura (HU04). */
const SEARCH_FIELDS = ['nome', 'email', 'nomeIniciativa'] as const;

/** Escapa o termo para que a busca seja literal (sem regex injetada). */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** HU04: monta o filtro do Mongo a partir do perfil e do termo de busca. */
export function buildUserFilter({
  perfil,
  busca,
}: UserSearchCriteria): UserFilter {
  const filter: UserFilter = {};
  if (perfil) filter.perfil = perfil;

  const term = busca?.trim();
  if (term) {
    const match: TextMatch = { $regex: escapeRegex(term), $options: 'i' };
    filter.$or = SEARCH_FIELDS.map((field) => ({ [field]: match }));
  }
  return filter;
}
