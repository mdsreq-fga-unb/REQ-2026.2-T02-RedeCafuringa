import type { ButtonHTMLAttributes, Ref } from "react";

const paths = {
    edit: "m15 5 4 4M4 20l4.5-1L20 7.5a1.4 1.4 0 0 0 0-2l-1.5-1.5a1.4 1.4 0 0 0-2 0L5 15.5 4 20Z",
    save: "m5 12 4 4L19 6",
    cancel: "m6 6 12 12M18 6 6 18",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
    action: keyof typeof paths;
    label: string;
    ref?: Ref<HTMLButtonElement>;
};

export function AccountEditButton({ action, label, ...props }: Props) {
    return (
        <button
            {...props}
            className={`account-edit-icon${action === "save" ? " account-edit-save" : ""}`}
            type={action === "save" ? "submit" : "button"}
            aria-label={label}
            title={label}
        >
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d={paths[action]} />
            </svg>
        </button>
    );
}
