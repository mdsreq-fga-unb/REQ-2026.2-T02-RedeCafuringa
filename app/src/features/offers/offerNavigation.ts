const KEY = "cafuringa-offer-origins";
const isDetails = (route: string) =>
    route.startsWith("/oferta/") ||
    new URLSearchParams(route.split("?")[1]).has("oferta");

function origins(): Record<string, string> {
    try {
        return JSON.parse(sessionStorage.getItem(KEY) ?? "{}");
    } catch {
        return {};
    }
}
export function rememberOfferOrigin(next: string, current: string) {
    if (isDetails(next) && next !== current && !isDetails(current)) {
        sessionStorage.setItem(
            KEY,
            JSON.stringify({ ...origins(), [next]: current }),
        );
    }
}
export function offerReturnRoute(route: string, fallback: string) {
    const origin = origins()[route];
    return typeof origin === "string" &&
        origin.startsWith("/") &&
        !origin.startsWith("//")
        ? origin
        : fallback;
}
