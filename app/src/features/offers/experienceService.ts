import { ApiHttpError, getApiClient } from "@/shared/api";
import { isMockAuthEnabled } from "@/features/auth/authMode";
import { saveDemoOffer, notifyOffersChanged } from "./publishedOffers";
import { prepareProfilePhoto } from "@/features/trajectory/photoResize";

export type ExperienceDraft = {
    nome: string;
    categoria: string;
    descricao: string;
    preco: string;
    local: string;
    duracao: string;
    fotos: File[];
};

export type RegisteredExperience = {
    id: string;
    nome: string;
    categoria: string;
    descricao: string;
    valorPorPessoa: number;
    local: string;
    duracao: string;
    fotos: string[];
    /** Responsável pela oferta (CA03, CA08): só dados de divulgação. */
    produtor: { id: string; nomeIniciativa: string; localidade?: string };
    /** Presente nas respostas da API (RN10); as rotas públicas só trazem disponíveis. */
    disponivel?: boolean;
};

/**
 * HU21: cadastra a experiência em `POST /experiences` (contrato 0.9.0). O
 * dono vem do token na API (RN09); a `Idempotency-Key` evita duplicar ao
 * reenviar após falha de conexão (CA07). No modo de demonstração grava no
 * navegador. Erros mantêm o formulário preenchido.
 */
export async function registerExperience(
    draft: ExperienceDraft,
    { idempotencyKey }: { idempotencyKey?: string } = {},
) {
    const token = localStorage.getItem("cafuringa-token");
    if (!token || localStorage.getItem("cafuringa-role") !== "producer") {
        throw new ApiHttpError({
            status: 401,
            message:
                "Entre com seu perfil de produtor para cadastrar experiências.",
        });
    }
    if (isMockAuthEnabled) {
        const fotos = await Promise.all(
            draft.fotos.map(
                (file) =>
                    new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(String(reader.result));
                        reader.onerror = () =>
                            reject(
                                new Error(
                                    "Não foi possível ler a foto selecionada.",
                                ),
                            );
                        reader.readAsDataURL(file);
                    }),
            ),
        );
        const experience = {
            id: `demo-experience-${crypto.randomUUID()}`,
            nome: draft.nome.trim(),
            categoria: draft.categoria,
            descricao: draft.descricao.trim(),
            valorPorPessoa: Number(draft.preco.replace(",", ".")),
            local: draft.local.trim(),
            duracao: draft.duracao.trim(),
            fotos,
            produtor: {
                id:
                    localStorage.getItem("cafuringa-user-id") ??
                    "demo-producer",
                nomeIniciativa:
                    localStorage.getItem("cafuringa-name") ??
                    "Produtor de teste",
            },
        } satisfies RegisteredExperience;
        saveDemoOffer(experience);
        return experience;
    }
    const body = new FormData();
    body.set("nome", draft.nome.trim());
    body.set("categoria", draft.categoria);
    body.set("descricao", draft.descricao.trim());
    body.set("valorPorPessoa", String(Number(draft.preco.replace(",", "."))));
    body.set("local", draft.local.trim());
    body.set("duracao", draft.duracao.trim());
    // RNF06/RNF11: reduz cada foto no aparelho e descarta o EXIF/GPS antes de
    // enviar (mesmo preparo da foto de perfil). Uma de cada vez, para poupar memória.
    for (const foto of draft.fotos)
        body.append("fotos", await prepareProfilePhoto(foto));
    const experience = await getApiClient().post<RegisteredExperience>(
        "/experiences",
        body,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                ...(idempotencyKey
                    ? { "Idempotency-Key": idempotencyKey }
                    : {}),
            },
        },
    );
    notifyOffersChanged();
    return experience;
}
