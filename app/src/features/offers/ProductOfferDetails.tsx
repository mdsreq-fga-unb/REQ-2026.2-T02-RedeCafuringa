import { listExperiences } from "./catalogItems";
import { listProducts } from "./productService";
import { BackButton } from "../../components/navigation/BackButton";
import { OfferDetailsPage } from "./OfferDetailsPage";
import { productToOffer } from "./productOffer";
import { useProductCatalog } from "./useProductCatalog";

type ProductOfferDetailsProps = {
    id: string;
    experience?: boolean;
    backPath?: string;
    onNavigate: (path: string) => void;
};

export function ProductOfferDetails({
    id,
    experience = false,
    backPath = "/produtos",
    onNavigate,
}: ProductOfferDetailsProps) {
    const { status, products } = useProductCatalog(
        experience ? listExperiences : listProducts,
    );
    const product = products.find((item) => item.id === id);

    if (product) {
        return (
            <OfferDetailsPage
                offer={productToOffer(product)}
                contactAvailable={false}
                backPath={backPath}
                onNavigate={onNavigate}
                onStartContact={() => undefined}
            />
        );
    }

    return (
        <>
            <BackButton label="Voltar" onClick={() => onNavigate(backPath)} />
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
