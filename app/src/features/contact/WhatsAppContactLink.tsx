const label = (
    <>
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="currentColor"
        >
            <path d="M12 2a9.8 9.8 0 0 0-8.5 14.7L2 22l5.5-1.4A9.8 9.8 0 1 0 12 2Zm0 1.8a8 8 0 1 1-4 15l-.3-.2-3.1.8.8-3-.2-.4A8 8 0 0 1 12 3.8Zm-3.1 4c-.2 0-.5 0-.7.3-.3.2-.8.8-.8 1.8 0 1.1.8 2.2.9 2.3.1.2 1.6 2.5 4 3.5 2 .8 2.4.5 2.8.5.4-.1 1.4-.6 1.6-1.2.2-.6.2-1 .1-1.1s-.2-.2-.5-.3l-1.6-.8c-.3-.1-.5-.2-.7.1l-.8.9c-.1.1-.3.2-.6 0a6.4 6.4 0 0 1-2.9-2.5c-.1-.2 0-.4.1-.5l.6-.7c.1-.2.1-.3 0-.5l-.7-1.7c-.2-.4-.4-.4-.6-.4Z" />
        </svg>
        Conversar pelo WhatsApp
    </>
);

/** Abre o contato autorizado no WhatsApp, fora da Rede Cafuringa. */
export function WhatsAppContactLink({ url }: { url: string }) {
    return (
        <a
            className="button button-whatsapp"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Conversar pelo WhatsApp (abre em nova aba)"
        >
            {label}
        </a>
    );
}
