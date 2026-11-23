import { useCallback, useEffect, useState } from "react";
import {
    BOOKING_UPDATE_READ_EVENT,
    listBookingUpdates,
    type BookingUpdate,
} from "./bookingNotificationsService";

import {
    BOOKING_RESPONSE_RECORDED_EVENT,
    listReceivedBookings,
    type ReceivedBooking,
} from "./receivedBookingsService";

const REFRESH_INTERVAL_MS = 30_000;

export function useUnreadBookingUpdates(
    session: string | null,
    listOpen: boolean,
    producer: boolean,
) {
    const [snapshot, setSnapshot] = useState<{
        session: string;
        updates: BookingUpdate[];
    } | null>(null);

    const [receivedSnapshot, setReceivedSnapshot] = useState<{
        session: string;
        bookings: ReceivedBooking[];
    } | null>(null);
    const reportReceived = useCallback(
        (bookings: ReceivedBooking[]) => {
            if (session) setReceivedSnapshot({ session, bookings });
        },
        [session],
    );

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
            const refreshList = producer
                ? listReceivedBookings(controller.signal).then((bookings) => {
                      if (!controller.signal.aborted) reportReceived(bookings);
                  })
                : listBookingUpdates(controller.signal).then((updates) => {
                      if (!controller.signal.aborted) reportUpdates(updates);
                  });
            void refreshList
                .catch(() => {
                    // A lista exibe o erro e permite tentar de novo.
                })
                .finally(() => {
                    if (request === controller) request = undefined;
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

        function recordResponse(event: Event) {
            if (!producer || !(event instanceof CustomEvent)) return;
            const booking = event.detail as ReceivedBooking;
            request?.abort();
            request = undefined;
            setReceivedSnapshot((snapshot) =>
                snapshot?.session === session
                    ? {
                          ...snapshot,
                          bookings: snapshot.bookings.map((item) =>
                              item.id === booking.id ? booking : item,
                          ),
                      }
                    : snapshot,
            );
            refresh();
        }

        if (!listOpen) refresh();
        const timer = window.setInterval(refresh, REFRESH_INTERVAL_MS);
        window.addEventListener("focus", refresh);
        document.addEventListener("visibilitychange", refresh);
        window.addEventListener(BOOKING_UPDATE_READ_EVENT, markRead);
        window.addEventListener(
            BOOKING_RESPONSE_RECORDED_EVENT,
            recordResponse,
        );
        return () => {
            request?.abort();
            window.clearInterval(timer);
            window.removeEventListener("focus", refresh);
            document.removeEventListener("visibilitychange", refresh);
            window.removeEventListener(BOOKING_UPDATE_READ_EVENT, markRead);
            window.removeEventListener(
                BOOKING_RESPONSE_RECORDED_EVENT,
                recordResponse,
            );
        };
    }, [session, listOpen, producer, reportUpdates, reportReceived]);

    const updates = snapshot?.session === session ? snapshot.updates : [];
    const received =
        receivedSnapshot?.session === session ? receivedSnapshot.bookings : [];
    return {
        updates,
        received,
        reportReceived,
        hasUnread: producer
            ? received.some((item) => item.status === "pendente")
            : updates.some((item) => item.nova),
        reportUpdates,
    };
}
