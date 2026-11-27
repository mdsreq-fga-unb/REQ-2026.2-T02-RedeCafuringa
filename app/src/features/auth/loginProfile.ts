import type { components } from "@/shared/api/schema";

/**
 * Perfil da tela de login. A mesma pessoa pode ter conta de consumidor e de
 * produtor com o mesmo e-mail: o perfil diz ao backend qual das duas abrir.
 */
export type LoginProfile = "consumer" | "producer";

type BackendLoginProfile = NonNullable<
    components["schemas"]["LoginDto"]["perfil"]
>;

const PERFIL: Record<LoginProfile, BackendLoginProfile> = {
    consumer: "CONSUMIDOR",
    producer: "PRODUTOR",
};

/** `{ perfil }` para o corpo da requisição, ou nada quando não há perfil. */
export function perfilField(profile?: LoginProfile): {
    perfil?: BackendLoginProfile;
} {
    return profile ? { perfil: PERFIL[profile] } : {};
}
