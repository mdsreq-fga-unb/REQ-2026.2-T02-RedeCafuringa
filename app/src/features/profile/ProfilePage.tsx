import { ActionButton } from "../../components/ui/ActionButton";

type ProfilePageProps = {
    contactAvailable: boolean;
    onNavigate: (path: string) => void;
    onStartContact: () => void;
};

export function ProfilePage({
    contactAvailable,
    onNavigate,
    onStartContact,
}: ProfilePageProps) {
    return (
        <>
            <div className="back-row">
                <button onClick={() => onNavigate("/perfil")}>
                    ← <span>Voltar</span>
                </button>
            </div>
            <section className="profile-page">
                <h1>Dona Maria</h1>
                <p className="eyebrow">Produtos - Experiências - Eventos</p>
                <img
                    className="profile-image"
                    src="https://images.unsplash.com/photo-1622182476528-da0467612510?auto=format&fit=crop&w=1400&q=85"
                    alt="Produtora sorrindo entre plantas, usando lenço colorido"
                />
                <h2>Minha Trajetória</h2>
                <p className="body-copy">
                    Somos uma iniciativa familiar que conecta os saberes do
                    campo à vida da cidade. Aqui, cada colheita conta uma
                    história.
                </p>
                <h2 className="section-heading">
                    Produção / Experiências / Eventos
                </h2>
                <p className="body-copy">
                    Hortaliças da estação, cestas agroecológicas e visitas
                    guiadas.
                </p>
                <div className="profile-actions">
                    <ActionButton
                        variant="orange"
                        onClick={() => onNavigate("/catalogo")}
                    >
                        Ver catálogo desse perfil
                    </ActionButton>
                    {contactAvailable && (
                        <ActionButton variant="green" onClick={onStartContact}>
                            Conversar pelo WhatsApp
                        </ActionButton>
                    )}
                </div>
            </section>
        </>
    );
}
