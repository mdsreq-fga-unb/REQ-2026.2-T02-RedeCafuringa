import { useState } from "react";
import type { InputHTMLAttributes } from "react";

export function PasswordInput(props: InputHTMLAttributes<HTMLInputElement>) {
    const [visible, setVisible] = useState(false);
    return (
        <div className="password-input">
            <input {...props} type={visible ? "text" : "password"} />
            <button
                type="button"
                className="password-toggle"
                aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
                aria-controls={props.id}
                disabled={props.disabled}
                onClick={() => setVisible((current) => !current)}
            >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                    <circle cx="12" cy="12" r="2.5" />
                    {visible && <path d="m3 3 18 18" />}
                </svg>
            </button>
        </div>
    );
}
