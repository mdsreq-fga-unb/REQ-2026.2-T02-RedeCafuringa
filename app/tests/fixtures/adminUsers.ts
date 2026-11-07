import type { components } from "@/shared/api/schema";

export type UserDetail = components["schemas"]["UserDetailResponse"];
export type UserList = components["schemas"]["UserListResponse"];

export const consumer: UserDetail = {
    id: "665f1c2e9b1d4a0012ab34c1",
    nome: "Maria Das Graças Bezerra",
    email: "maria@exemplo.com",
    perfil: "CONSUMIDOR",
    cpf: "***.982.247-**",
    telefone: "61999990000",
};

export const producer: UserDetail = {
    id: "665f1c2e9b1d4a0012ab34c2",
    nome: "Ana Júlia Bezerra",
    email: "raizes@exemplo.com",
    perfil: "PRODUTOR",
    nomeIniciativa: "Sítio Raízes",
    nomeResponsavel: "Ana Júlia Bezerra",
    cpf: "***.444.777-**",
    cnpj: "**.222.333/0001-**",
    categoriaOfertada: "Produtos",
    localidade: "Cafuringa, Brasília, DF",
    formasPagamento: ["Pix", "Cartão de crédito"],
};

export const admin: UserDetail = {
    id: "665f1c2e9b1d4a0012ab34c3",
    nome: "Administrador",
    email: "admin@exemplo.com",
    perfil: "ADMINISTRADOR",
};

// A listagem segue o DTO resumido, sem documentos ou campos exclusivos do detalhe.
export const userPage: UserList = {
    itens: [admin, producer, consumer].map(({ id, nome, email, perfil }) => ({
        id,
        nome,
        email,
        perfil,
    })),
    total: 3,
    pagina: 1,
    limite: 20,
};

export function jsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
    });
}
