import { BackButton } from "@/components/navigation/BackButton";
import { ActionButton } from "@/components/ui/ActionButton";

type BookingSentPageProps = {
    onBack: () => void;
    onTrack: () => void;
    onContinue: () => void;
};

export function BookingSentPage({
    onBack,
    onTrack,
    onContinue,
}: BookingSentPageProps) {
    return (
        <section className="login-page booking-page booking-sent">
            <BackButton label="Voltar" onClick={onBack} />
            <div className="booking-sent-icon" aria-hidden="true">
                ✓
            </div>
            <h1>Solicitação enviada</h1>
            <p>
                Agora o produtor vai conferir a disponibilidade para receber
                você.
            </p>
            <p className="booking-notice" role="status">
                Você será avisado quando o status mudar. Ainda não há reserva
                confirmada.
            </p>
            <div className="login-actions">
                <ActionButton variant="orange" type="button" onClick={onTrack}>
                    Acompanhar solicitação
                </ActionButton>
                <ActionButton
                    variant="outline"
                    type="button"
                    onClick={onContinue}
                >
                    Continuar explorando
                </ActionButton>
            </div>
        </section>
    );
}