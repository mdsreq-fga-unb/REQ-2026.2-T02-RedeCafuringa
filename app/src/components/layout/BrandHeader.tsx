type BrandHeaderProps = {
    onHome: () => void;
    onLogin?: () => void;
};

export function BrandHeader({ onHome, onLogin }: BrandHeaderProps) {
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
            {onLogin && (
                <button className="explore-login" onClick={onLogin}>
                    Entrar
                </button>
            )}
        </header>
    );
}
