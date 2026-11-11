import type { ButtonHTMLAttributes } from "react";

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant: "orange" | "green" | "green-soft" | "outline";
};

const variantClass = {
    orange: "button-orange",
    green: "button-green",
    "green-soft": "button-green button-green-soft",
    outline: "button-outline",
} satisfies Record<ActionButtonProps["variant"], string>;

export function ActionButton({
    variant,
    className = "",
    ...props
}: ActionButtonProps) {
    return (
        <button
            className={`button ${variantClass[variant]} ${className}`.trim()}
            {...props}
        />
    );
}
