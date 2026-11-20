import { useEffect, useState } from "react";
import { BackButton } from "@/components/navigation/BackButton";
import { ActionButton } from "@/components/ui/ActionButton";
import { getExperienceDetails } from "@/features/offers/catalogItems";
import { BookingFormPage, type BookingExperience } from "./BookingFormPage";
import type { Booking } from "./bookingTypes";
import "./bookings.css";

type BookingRoutePageProps = {
    experienceId: string;
    onBack: () => void;
    onSent: (booking: Booking) => void;
    /** Injetável para testes; o padrão consulta a API (ou o mock). */
    loadExperience?: (
        id: string,
        signal?: AbortSignal,
    ) => Promise<BookingExperience | null>;
};

type LoadState =
    | { status: "loading" }
    | { status: "ready"; experience: BookingExperience }
    | { status: "unavailable" }
    | { status: "error" };

export function BookingRoutePage({
    experienceId,
    onBack,
    onSent,
    loadExperience = getExperienceDetails,
}: BookingRoutePageProps) {
    const [state, setState] = useState<LoadState>({ status: "loading" });
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        setState({ status: "loading" });
        loadExperience(experienceId, controller.signal).then(
            (experience) => {
                if (controller.signal.aborted) return;
                setState(
                    experience
                        ? { status: "ready", experience }
                        : { status: "unavailable" },
                );
            },
            () => {
                if (!controller.signal.aborted) setState({ status: "error" });
            },
        );
        return () => controller.abort();
    }, [experienceId, attempt, loadExperience]);

    if (state.status === "ready") {
        return (
            <BookingFormPage
                key={state.experience.id}
                experience={state.experience}
                onBack={onBack}
                onSent={onSent}
            />
        );
    }

    if (state.status === "loading") {
        return (
            <section className="login-page booking-page">
                <p role="status">Carregando experiência…</p>
            </section>
        );
    }

    return (
        <section className="login-page booking-page">
            <BackButton label="Voltar" onClick={onBack} />
            {state.status === "unavailable" ? (
                <p className="form-alert" role="alert">
                    Esta experiência não está disponível para pré-reserva.
                </p>
            ) : (
                <>
                    <p className="form-alert" role="alert">
                        Não foi possível carregar a experiência. Tente
                        novamente.
                    </p>
                    <ActionButton
                        variant="outline"
                        type="button"
                        onClick={() => setAttempt((count) => count + 1)}
                    >
                        Tentar novamente
                    </ActionButton>
                </>
            )}
        </section>
    );
}
