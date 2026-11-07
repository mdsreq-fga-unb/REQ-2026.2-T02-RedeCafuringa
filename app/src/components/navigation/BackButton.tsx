type BackButtonProps = {
    label: string;
    onClick: () => void;
};

export function BackButton({ label, onClick }: BackButtonProps) {
    return (
        <div className="back-row">
            <button onClick={onClick} aria-label={label}>
                ← <span>{label}</span>
            </button>
        </div>
    );
}
