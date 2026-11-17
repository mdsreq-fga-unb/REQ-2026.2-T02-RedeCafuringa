import { useEffect, useState } from "react";
import { BackButton } from "@/components/navigation/BackButton";
import { ActionButton } from "@/components/ui/ActionButton";
import { getPublicTrajectory } from "@/features/trajectory/trajectoryService";
import { getContactLoginRoute, whatsAppContactUrl } from "@/features/contact";
import { getExperienceDetails } from "./catalogItems";
import { getProductDetails } from "./productDetailsService";
import { OfferDetailsPage } from "./OfferDetailsPage";
import { productToOffer } from "./productOffer";
import type { Product } from "./productTypes";

type State = {
    status: "loading" | "ready" | "missing" | "error";
    product?: Product;
    /** HU39: link wa.me do contato autorizado pelo responsável. */
    contactUrl?: string;
};
type Props = {
    id: string;
    experience?: boolean;
    /** RN17: só quem está autenticado recebe o link do wa.me. */
    authenticated?: boolean;
    backPath?: string;
    onNavigate: (path: string) => void;
};

export function ProductOfferDetails({
    id,
    experience = false,
    authenticated = false,
    backPath = "/produtos",
    onNavigate,
}: Props) {
    const [state, setState] = useState<State>({ status: "loading" });
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        const controller = new AbortController();
        const load = experience
            ? getExperienceDetails(id, controller.signal)
            : getProductDetails(id, controller.signal);
        void load
            .then((product) => {
                if (controller.signal.aborted) return;
                if (!product) {
                    setState({ status: "missing" });
                    return;
                }
                setState({ status: "ready", product });
                // HU39: o contato vem do perfil público do responsável, que só
                // traz o telefone quando ele autorizou (RN07). Nunca de dados
                // locais, e sem exigir login (CA05).
                if (product.producerId) {
                    void getPublicTrajectory(
                        product.producerId,
                        controller.signal,
                    )
                        .then((profile) => {
                            const contactUrl = whatsAppContactUrl(
                                profile.telefone,
                                product.name,
                            );
                            if (!controller.signal.aborted && contactUrl)
                                setState({
                                    status: "ready",
                                    product,
                                    contactUrl,
                                });
                        })
                        .catch(() => {
                            /* O contato opcional não impede a leitura do produto. */
                        });
                }
            })
            .catch(() => {
                if (!controller.signal.aborted) setState({ status: "error" });
            });
        return () => controller.abort();
    }, [id, experience, attempt]);

    if (state.status === "ready" && state.product)
        return (
            <OfferDetailsPage
                offer={productToOffer(state.product)}
                contactUrl={state.contactUrl}
                onContactRequiresLogin={
                    authenticated
                        ? undefined
                        : () =>
                              onNavigate(
                                  getContactLoginRoute(
                                      `${experience ? "experiencia" : "produto"}/${id}`,
                                  ),
                              )
                }
                backPath={backPath}
                onNavigate={onNavigate}
            />
        );
    return (
        <>
            <BackButton label="Voltar" onClick={() => onNavigate(backPath)} />
            <section
                className="offer-page"
                aria-busy={state.status === "loading"}
            >
                {state.status === "loading" && (
                    <p role="status">Carregando oferta...</p>
                )}
                {state.status === "missing" && (
                    <>
                        <h1>
                            {experience
                                ? "Experiência indisponível"
                                : "Produto indisponível"}
                        </h1>
                        <p role="alert">
                            {experience
                                ? "Experiência não encontrada ou indisponível para consulta."
                                : "Produto não encontrado ou indisponível para consulta."}
                        </p>
                    </>
                )}
                {state.status === "error" && (
                    <>
                        <h1>
                            {experience
                                ? "Detalhes da experiência"
                                : "Detalhes do produto"}
                        </h1>
                        <p role="alert">
                            Não foi possível carregar a oferta. Verifique sua
                            conexão e tente novamente.
                        </p>
                        <ActionButton
                            variant="outline"
                            onClick={() => {
                                setState({ status: "loading" });
                                setAttempt((value) => value + 1);
                            }}
                        >
                            Tentar novamente
                        </ActionButton>
                    </>
                )}
            </section>
        </>
    );
}
