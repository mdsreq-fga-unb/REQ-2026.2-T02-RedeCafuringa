import { BrandHeader, BottomNavigation } from "@/components";
import { AccountPage } from "@/features/account";
import { LoginPage, useDemoSession } from "@/features/auth";
import {
    canStartWhatsAppContact,
    createWhatsAppUrl,
    getContactLoginRoute,
    isWhatsAppContactAvailable,
    useContactSettings,
} from "@/features/contact";
import { CatalogPage, offers, OfferDetailsPage } from "@/features/offers";
import { ProfilePage } from "@/features/profile";
import { useHashRoute } from "./useHashRoute";
import "../App.css";

export function App() {
    const { route, navigate } = useHashRoute();
    const { role, consumerName, loginName, setLoginName, signIn, signOut } =
        useDemoSession();
    const { settings, draft, setDraft, saved, setSaved, save } =
        useContactSettings();

    const path = route.split("?")[0];
    const offerId = path.startsWith("/oferta/")
        ? path.split("/").filter(Boolean)[1]
        : undefined;
    const currentOffer = offers.find((offer) => offer.id === offerId);
    const contactAvailable = isWhatsAppContactAvailable(
        settings.authorized,
        settings.whatsappNumber,
    );

    const startContact = (subjectId: string, subject: string) => {
        if (role !== "consumer") {
            navigate(getContactLoginRoute(subjectId));
            return;
        }
        if (
            !canStartWhatsAppContact(
                role,
                settings.authorized,
                settings.whatsappNumber,
            )
        ) {
            return;
        }
        window.open(
            createWhatsAppUrl(settings.whatsappNumber, subject),
            "_blank",
            "noopener,noreferrer",
        );
    };

    const handleSignIn = (nextRole: "consumer" | "producer") => {
        const subjectId = new URLSearchParams(route.split("?")[1] || "").get(
            "contato",
        );
        signIn(nextRole);

        if (
            nextRole === "consumer" &&
            subjectId &&
            canStartWhatsAppContact(
                nextRole,
                settings.authorized,
                settings.whatsappNumber,
            )
        ) {
            const subject =
                offers.find((offer) => offer.id === subjectId)?.title ||
                "Perfil de Dona Maria";
            window.open(
                createWhatsAppUrl(settings.whatsappNumber, subject),
                "_blank",
                "noopener,noreferrer",
            );
            navigate(
                subjectId === "perfil" ? "/perfil" : `/oferta/${subjectId}`,
            );
            return;
        }

        navigate(nextRole === "producer" ? "/conta" : "/perfil");
    };

    return (
        <div className="app-shell">
            <BrandHeader onHome={() => navigate("/perfil")} />
            <main className="main-content">
                {path === "/perfil" && (
                    <ProfilePage
                        contactAvailable={contactAvailable}
                        onNavigate={navigate}
                        onStartContact={() =>
                            startContact("perfil", "Perfil de Dona Maria")
                        }
                    />
                )}
                {path === "/catalogo" && (
                    <CatalogPage offers={offers} onNavigate={navigate} />
                )}
                {currentOffer && (
                    <OfferDetailsPage
                        offer={currentOffer}
                        contactAvailable={contactAvailable}
                        onNavigate={navigate}
                        onStartContact={() =>
                            startContact(currentOffer.id, currentOffer.title)
                        }
                    />
                )}
                {path === "/entrar" && (
                    <LoginPage
                        loginName={loginName}
                        onLoginNameChange={setLoginName}
                        onNavigate={navigate}
                        onSignIn={handleSignIn}
                    />
                )}
                {path === "/conta" && (
                    <AccountPage
                        role={role}
                        consumerName={consumerName}
                        settings={settings}
                        draft={draft}
                        saved={saved}
                        onDraftChange={setDraft}
                        onSavedChange={setSaved}
                        onSaveContact={save}
                        onNavigate={navigate}
                        onSignOut={() => {
                            signOut();
                            navigate("/perfil");
                        }}
                    />
                )}
            </main>
            <BottomNavigation path={path} role={role} onNavigate={navigate} />
        </div>
    );
}

export default App;
