import { useEffect, useState, type FormEvent } from "react";
import type { ContactSettings } from "../../shared/types";
import { normalizeWhatsAppNumber } from "./contact-flow.js";

const STORAGE_KEY = "cafuringa-contact";

const defaultSettings: ContactSettings = {
    whatsappNumber: "",
    authorized: false,
};

const readSettings = (): ContactSettings => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved
            ? { ...defaultSettings, ...(JSON.parse(saved) as ContactSettings) }
            : defaultSettings;
    } catch {
        return defaultSettings;
    }
};

export function useContactSettings() {
    const [settings, setSettings] = useState<ContactSettings>(readSettings);
    const [draft, setDraft] = useState<ContactSettings>(readSettings);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }, [settings]);

    useEffect(() => {
        localStorage.removeItem("cafuringa-conversations");
    }, []);

    const save = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const normalized = {
            ...draft,
            whatsappNumber: normalizeWhatsAppNumber(draft.whatsappNumber),
        };
        setSettings(normalized);
        setDraft(normalized);
        setSaved(true);
    };

    return { settings, draft, setDraft, saved, setSaved, save };
}
