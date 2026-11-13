import { BackButton } from "../../components/navigation/BackButton";
import { OfferDetailsPage } from "./OfferDetailsPage";
import { productToOffer } from "./productOffer";
import { useProductCatalog } from "./useProductCatalog";

type ProductOfferDetailsProps = {
    id: string;
    onNavigate: (path: string) => void;
};

export function ProductOfferDetails({
    id,
    onNavigate,
}: ProductOfferDetailsProps) {
    const { status, products } = useProductCatalog();
    const product = products.find((item) => item.id === id);

    if (product) {
        return (
            <OfferDetailsPage
                offer={productToOffer(product)}
                contactAvailable={false}
                backPath="/produtos"
                onNavigate={onNavigate}
                onStartContact={() => undefined}
            />
        );
    }

    return (
        <>
            <BackButton
                label="Voltar"
                onClick={() => onNavigate("/produtos")}
            />
            <section className="offer-page">
                {status === "loading" && (
                    <p role="status">Carregando oferta...</p>
                )}
                {status === "error" && (
                    <p role="alert">Não foi possível carregar a oferta.</p>
                )}
                {status === "ready" && <p>Oferta não encontrada.</p>}
            </section>
        </>
    );
}
