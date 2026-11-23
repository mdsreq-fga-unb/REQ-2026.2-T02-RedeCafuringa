import { useCallback, useEffect, useState } from "react";
import {
    BOOKING_UPDATE_READ_EVENT,
    listBookingUpdates,
    type BookingUpdate,
} from "./bookingNotificationsService";

const REFRESH_INTERVAL_MS = 30_000;

export function useUnreadBookingUpdates(
    session: string | null,
    listOpen: boolean,
) {
    const [snapshot, setSnapshot] = useState<{
        session: string;
        updates: BookingUpdate[];
    } | null>(null);

    const reportUpdates = useCallback(
        (updates: BookingUpdate[]) => {
            if (session)
                setSnapshot({
                    session,
                    updates,
                });
        },
        [session],
    );

    useEffect(() => {
        if (!session) return;
        let request: AbortController | undefined;

        function refresh() {
            if (document.visibilityState === "hidden" || request) return;
            const controller = new AbortController();
            request = controller;
            void listBookingUpdates(controller.signal)
                .then((updates) => {
                    if (!controller.signal.aborted) reportUpdates(updates);
                })
                .catch(() => {
                    // A lista exibe o erro e permite tentar de novo.
                })
                .finally(() => {
                    request = undefined;
                });
        }

        function markRead(event: Event) {
            if (!(event instanceof CustomEvent)) return;
            setSnapshot((snapshot) =>
                snapshot?.session === session
                    ? {
                          ...snapshot,
                          updates: snapshot.updates.map((item) =>
                              item.id === event.detail
                                  ? { ...item, nova: false }
                                  : item,
                          ),
                      }
                    : snapshot,
            );
        }

        if (!listOpen) refresh();
        const timer = window.setInterval(refresh, REFRESH_INTERVAL_MS);
        window.addEventListener("focus", refresh);
        document.addEventListener("visibilitychange", refresh);
        window.addEventListener(BOOKING_UPDATE_READ_EVENT, markRead);
        return () => {
            request?.abort();
            window.clearInterval(timer);
            window.removeEventListener("focus", refresh);
            document.removeEventListener("visibilitychange", refresh);
            window.removeEventListener(BOOKING_UPDATE_READ_EVENT, markRead);
        };
    }, [session, listOpen, reportUpdates]);

    const updates = snapshot?.session === session ? snapshot.updates : [];
    return {
        updates,
        hasUnread: updates.some((item) => item.nova),
        reportUpdates,
    };
}
