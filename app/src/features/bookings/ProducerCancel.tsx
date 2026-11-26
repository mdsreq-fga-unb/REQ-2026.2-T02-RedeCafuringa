import { useState } from "react";
import { ActionButton } from "@/components/ui/ActionButton";
import { formatCentavos } from "@/features/payments/money";
import { BookingCancelError } from "./bookingCancelService";
import { depositOnCancel } from "./bookingCancellation";
import type { BookingDetail } from "./bookingDetails";

const FAILED =
    "O cancelamento não foi concluído. A pré-reserva continua aceita. Verifique a conexão e tente novamente.";

/**
 * RN20 revista: a produtora cancela a pré-reserva aceita, depois de confirmar
 * na própria tela. Com sinal pago, ela devolve o valor integral.
 */
export function ProducerCancel({
    booking,
    cancel,
    onCancelled,
}: {
    booking: BookingDetail;
    cancel: () => Promise<unknown>;
    onCancelled: () => void;
}) {
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const deposit = depositOnCancel(booking, "produtora");

    if (!open)
        return (
            <button
                type="button"
                className="button booking-cancel-button"
                onClick={() => setOpen(true)}
            >
                Cancelar pré-reserva
            </button>
        );

    const confirm = async () => {
        setBusy(true);
        setError("");
        try {
            await cancel();
            onCancelled();
        } catch (cause) {
            setError(
                cause instanceof BookingCancelError ? cause.message : FAILED,
            );
            setBusy(false);
        }
    };

    return (
        <div
            className="booking-producer-cancel"
            role="group"
            aria-label="Cancelar pré-reserva"
        >
            <p className="booking-cancel-warning">
                {deposit
                    ? `A consumidora verá a pré-reserva como cancelada, e você devolve o sinal de ${formatCentavos(deposit.cents)} por Pix.`
                    : "A consumidora verá a pré-reserva como cancelada."}
            </p>
            {error && (
                <p className="form-alert" role="alert">
                    {error}
                </p>
            )}
            <div className="login-actions">
                <button
                    type="button"
                    className="button booking-cancel-button"
                    disabled={busy}
                    onClick={() => void confirm()}
                >
                    Sim, cancelar pré-reserva
                </button>
                <ActionButton
                    variant="outline"
                    type="button"
                    disabled={busy}
                    onClick={() => setOpen(false)}
                >
                    Manter pré-reserva
                </ActionButton>
            </div>
        </div>
    );
}
