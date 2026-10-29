type BackButtonProps = {
    label: string;
    onClick: () => void;
};

export function BackButton({ label, onClick }: BackButtonProps) {
    return (
        <div className="back-row">
            <button onClick={onClick}>
                ← <span>{label}</span>
            </button>
        </div>
    );
}
