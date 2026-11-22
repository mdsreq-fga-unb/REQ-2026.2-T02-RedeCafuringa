type BackButtonProps = {
    label: string;
    onClick: () => void;
    disabled?: boolean;
};

export function BackButton({ label, onClick, disabled }: BackButtonProps) {
    return (
        <div className="back-row">
            <button onClick={onClick} aria-label={label} disabled={disabled}>
                ← <span>{label}</span>
            </button>
        </div>
    );
}
