import type { Role } from "@/shared/types";

/** Página principal de cada perfil (protótipo: Explorar e Início/Painel). */
const HOME: Record<Role, string> = {
    admin: "/admin/acesso",
    consumer: "/explorar",
    producer: "/explorar",
};

/**
 * Para onde o app vai depois do login. Sem pedido pendente, a página
 * principal do perfil (não a Conta). Com `?contato=` (link antigo de contato
 * que exigia login), volta para a oferta ou o perfil de origem. O
 * identificador vem da URL e é sempre codificado.
 */
export function postLoginRoute(role: Role, subject: string | null): string {
    return role === "admin"
        ? HOME.admin
        : (contactReturnRoute(subject) ?? HOME[role]);
}

export function contactReturnRoute(subject: string | null): string | undefined {
    if (!subject) return undefined;
    const [kind, ...rest] = subject.split("/");
    const id = rest.join("/");
    if (kind === "produto")
        return id ? `/oferta/${encodeURIComponent(id)}` : undefined;
    if (kind === "experiencia")
        return id
            ? `/oferta/${encodeURIComponent(id)}?tipo=experiencia`
            : undefined;
    if (kind === "produtor")
        return id ? `/produtor/${encodeURIComponent(id)}` : undefined;
    if (subject === "perfil") return "/perfil";
    return `/oferta/${encodeURIComponent(subject)}`;
}
