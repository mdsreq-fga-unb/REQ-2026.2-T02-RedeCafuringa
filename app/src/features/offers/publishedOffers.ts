import type { RegisteredProduct } from "./productService";
import type { RegisteredExperience } from "./experienceService";

export type RegisteredOffer = RegisteredProduct | RegisteredExperience;
export const OFFERS_CHANGED = "cafuringa:offers-changed";
export const DEMO_OFFERS_KEY = "cafuringa-demo-offers";

export function readDemoOffers(): RegisteredOffer[] {
    try {
        const data: unknown = JSON.parse(
            localStorage.getItem(DEMO_OFFERS_KEY) ?? "[]",
        );
        return Array.isArray(data)
            ? data.filter(
                  (item) =>
                      item &&
                      typeof item.id === "string" &&
                      item.produtor &&
                      Array.isArray(item.fotos),
              )
            : [];
    } catch {
        return [];
    }
}

export function saveDemoOffer(offer: RegisteredOffer) {
    localStorage.setItem(
        DEMO_OFFERS_KEY,
        JSON.stringify([
            offer,
            ...readDemoOffers().filter((item) => item.id !== offer.id),
        ]),
    );
    notifyOffersChanged();
}

export function notifyOffersChanged() {
    window.dispatchEvent(new Event(OFFERS_CHANGED));
}
