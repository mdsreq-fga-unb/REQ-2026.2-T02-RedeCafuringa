import { useEffect, useState } from "react";
import { BackButton } from "@/components/navigation/BackButton";
import { ActionButton } from "@/components/ui/ActionButton";
import { getPublicTrajectory } from "@/features/trajectory/trajectoryService";
import {
    createWhatsAppUrl,
    isWhatsAppContactAvailable,
} from "@/features/contact";
import { listExperiences } from "./catalogItems";
import { getProductDetails } from "./productDetailsService";
import { OfferDetailsPage } from "./OfferDetailsPage";
import { productToOffer } from "./productOffer";
import type { Product } from "./productTypes";

type State = {
    status: "loading" | "ready" | "missing" | "error";
    product?: Product;
    phone?: string;
};
type Props = {
    id: string;
    experience?: boolean;
    consumer?: boolean;
    resumeContact?: boolean;
    backPath?: string;
    onNavigate: (path: string) => void;
};

export function ProductOfferDetails({
    id,
    experience = false,
    consumer = false,
    resumeContact = false,
    backPath = "/produtos",
    onNavigate,
}: Props) {
    const [state, setState] = useState<State>({ status: "loading" });
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        const controller = new AbortController();
        const load = experience
            ? listExperiences().then(
                  (items) => items.find((item) => item.id === id) ?? null,
              )
            : getProductDetails(id, controller.signal);
        void load
            .then((product) => {
                if (controller.signal.aborted) return;
                if (!product) {
                    setState({ status: "missing" });
                    return;
                }
                setState({ status: "ready", product });
                if (product.producerId) {
                    void getPublicTrajectory(
                        product.producerId,
                        controller.signal,
                    )
                        .then((profile) => {
                            if (
                                !controller.signal.aborted &&
                                profile.telefone &&
                                isWhatsAppContactAvailable(
                                    true,
                                    profile.telefone,
                                )
                            ) {
                                setState({
                                    status: "ready",
                                    product,
                                    phone: profile.telefone,
                                });
                                if (resumeContact && consumer) {
                                    const digits = profile.telefone.replace(
                                        /\D/g,
                                        "",
                                    );
                                    window.open(
                                        createWhatsAppUrl(
                                            digits.length <= 11
                                                ? `55${digits}`
                                                : digits,
                                            product.name,
                                        ),
                                        "_blank",
                                        "noopener,noreferrer",
                                    );
                                    onNavigate(
                                        `/oferta/${encodeURIComponent(id)}`,
                                    );
                                }
                            }
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
    }, [id, experience, attempt, resumeContact, consumer, onNavigate]);

    const startContact = () => {
        if (!state.phone || !state.product) return;
        if (!consumer) {
            onNavigate(
                `/entrar?contato=${encodeURIComponent(`produto/${id}`)}`,
            );
            return;
        }
        const digits = state.phone.replace(/\D/g, "");
        const number = digits.length <= 11 ? `55${digits}` : digits;
        window.open(
            createWhatsAppUrl(number, state.product.name),
            "_blank",
            "noopener,noreferrer",
        );
    };
    if (state.status === "ready" && state.product)
        return (
            <OfferDetailsPage
                offer={productToOffer(state.product)}
                contactAvailable={!!state.phone}
                backPath={backPath}
                onNavigate={onNavigate}
                onStartContact={startContact}
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
                        <h1>Produto indisponível</h1>
                        <p role="alert">
                            Produto não encontrado ou indisponível para
                            consulta.
                        </p>
                    </>
                )}
                {state.status === "error" && (
                    <>
                        <h1>Detalhes do produto</h1>
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
