import { useId, useMemo, useRef, useState } from "react";
import qrcode from "qrcode-generator";
import { ActionButton } from "@/components/ui/ActionButton";
import { formatCentavos } from "./money";
import { buildPixCode, type PixCodeInput } from "./pixCode";
import "./payments.css";

const UNAVAILABLE =
    "O Pix desta produtora não está disponível. Fale com ela para combinar o pagamento.";
const COPIED =
    "Código copiado. Cole no app do seu banco, na opção Pix copia e cola.";
const COPY_FAILED =
    "Não foi possível copiar. O código está selecionado: copie e cole no app do banco.";

/** QR Code gerado no aparelho: a chave nunca vai a um serviço externo. */
function qrDataUrl(code: string): string {
    const qr = qrcode(0, "M");
    qr.addData(code);
    qr.make();
    const svg = qr.createSvgTag({ cellSize: 4, margin: 4, scalable: true });
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function pixData(input: PixCodeInput) {
    try {
        const code = buildPixCode(input);
        return { code, qr: qrDataUrl(code) };
    } catch {
        return null;
    }
}

/** Valor, QR Code, copia e cola e recebedor de um pagamento por Pix. */
export function PixPayment(props: PixCodeInput) {
    const { chave, nome, cidade, valorCentavos, txid } = props;
    const data = useMemo(
        () => pixData({ chave, nome, cidade, valorCentavos, txid }),
        [chave, nome, cidade, valorCentavos, txid],
    );
    const [message, setMessage] = useState("");
    const field = useRef<HTMLTextAreaElement>(null);
    const id = useId();

    if (!data)
        return (
            <p className="pix-unavailable" role="alert">
                {UNAVAILABLE}
            </p>
        );

    const valor =
        valorCentavos === undefined ? undefined : formatCentavos(valorCentavos);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(data.code);
            setMessage(COPIED);
        } catch {
            field.current?.focus();
            field.current?.select();
            setMessage(COPY_FAILED);
        }
    };

    return (
        <section className="pix-payment" aria-label="Pagamento por Pix">
            <dl className="pix-summary">
                {valor && (
                    <div>
                        <dt>Valor</dt>
                        <dd className="pix-amount">{valor}</dd>
                    </div>
                )}
                <div>
                    <dt>Recebedor</dt>
                    <dd>{nome}</dd>
                </div>
            </dl>
            <img
                className="pix-qr"
                src={data.qr}
                width={220}
                height={220}
                alt={`QR Code do Pix${valor ? ` de ${valor}` : ""} para ${nome}`}
            />
            <label className="field-label" htmlFor={`${id}-code`}>
                Código Pix copia e cola
            </label>
            <textarea
                ref={field}
                id={`${id}-code`}
                className="text-input pix-code"
                readOnly
                rows={4}
                value={data.code}
                spellCheck={false}
            />
            <ActionButton variant="orange" type="button" onClick={copy}>
                Copiar código Pix
            </ActionButton>
            {message && (
                <p className="pix-message" role="status">
                    {message}
                </p>
            )}
        </section>
    );
}
