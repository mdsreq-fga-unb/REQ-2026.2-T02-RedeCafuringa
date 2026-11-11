type BrandHeaderProps = {
    onHome: () => void;
};

export function BrandHeader({ onHome }: BrandHeaderProps) {
    return (
        <header className="topbar">
            <button
                className="brand"
                onClick={onHome}
                aria-label="Cafuringa, início"
            >
                <img className="brand-logo" src="/folha-logo.svg" alt="" />
                <span>Cafuringa</span>
            </button>
        </header>
    );
}
