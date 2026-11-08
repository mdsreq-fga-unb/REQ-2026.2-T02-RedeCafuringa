import { useEffect } from "react";
import { BrandHeader, BottomNavigation } from "@/components";
import { AccountPage } from "@/features/account";
import {
    AdminAccessPage,
    AdminSignupPage,
    AdminSignupSuccessPage,
    AdminLoginPage,
    registerAdmin,
    ConsumerProfileSelectionPage,
    ConsumerSignupPage,
    ConsumerSignupSuccessPage,
    LoginPage,
    ProducerSignupSuccessPage,
    registerConsumer,
    useDemoSession,
} from "@/features/auth";
import {
    canStartWhatsAppContact,
    createWhatsAppUrl,
    getContactLoginRoute,
    isWhatsAppContactAvailable,
    useContactSettings,
} from "@/features/contact";
import { CatalogPage, offers, OfferDetailsPage } from "@/features/offers";
import { ProfilePage } from "@/features/profile";
import type { AuthResult } from "@/shared/types";
import { useHashRoute } from "./useHashRoute";
import { RegisterPage } from "@/features/register";
import "../App.css";
import { isMockAuthEnabled } from "@/features/auth/authMode";
import { DemoNavigation } from "@/features/auth/DemoNavigation";
import { RecoverAccessPage, ResetPasswordPage } from "@/features/recovery";
import { getMockRecoveryLink } from "@/features/recovery/mockRecovery";

export function App() {
    const { route, navigate } = useHashRoute();
    const { role, consumerName, email, cpf, signIn, signOut } =
        useDemoSession();
    const { settings, draft, setDraft, saved, setSaved, save } =
        useContactSettings();

    const path = route.split("?")[0];
    const query = new URLSearchParams(route.split("?")[1] || "");
    const fromContact = query.has("contato");
    const justRegistered = query.get("cadastro") === "ok";
    const justRecovered = query.get("recuperacao") === "ok";
    const recoveryToken = query.get("token");
    // RN03/RNF08: só administrador autenticado cadastra outro (o backend também exige).
    const adminOnly =
        path === "/cadastro/administrador" || path === "/conta-criada/admin";
    const adminBlocked = adminOnly && role !== "admin";
    useEffect(() => {
        if (adminBlocked) navigate("/admin/entrar");
    }, [adminBlocked]); // eslint-disable-line react-hooks/exhaustive-deps
    const needsProfileSelection =
        role === null &&
        ["/conta", "/notificacoes", "/reservas"].includes(path);
    const screenPath = needsProfileSelection ? "/escolher-perfil" : path;
    const showProfileSelection = screenPath === "/escolher-perfil";
    const showLogin =
        screenPath === "/entrar" || path.startsWith("/login/") || fromContact;
    const loginProfile =
        path === "/login/consumer" || fromContact ? "consumer" : "producer";
    const isAuthFlow =
        path.startsWith("/admin/") ||
        path === "/cadastro/administrador" ||
        path === "/conta-criada/admin" ||
        showProfileSelection ||
        showLogin ||
        path === "/cadastro/consumidor" ||
        path === "/conta-criada/consumer" ||
        path === "/conta-criada/producer" ||
        path === "/recuperar-acesso" ||
        path === "/nova-senha" ||
        path === "/cadastro";
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

    const handleSignIn = (auth: AuthResult) => {
        const nextRole = auth.user.role;
        const subjectId = new URLSearchParams(route.split("?")[1] || "").get(
            "contato",
        );
        signIn(auth);

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

        navigate("/conta");
    };

    return (
        <div className={`app-shell ${isAuthFlow ? "auth-shell" : ""}`}>
            <BrandHeader onHome={() => navigate("/perfil")} />
            {isMockAuthEnabled && (
                <DemoNavigation onNavigate={navigate} onSignIn={signIn} />
            )}
            <main className="main-content">
                {path === "/admin/acesso" && (
                    <AdminAccessPage onNavigate={navigate} />
                )}
                {path === "/admin/entrar" && (
                    <AdminLoginPage onNavigate={navigate} onSignIn={signIn} />
                )}
                {path === "/cadastro/administrador" && !adminBlocked && (
                    <AdminSignupPage
                        createAccount={registerAdmin}
                        onNavigate={navigate}
                    />
                )}
                {path === "/conta-criada/admin" && !adminBlocked && (
                    <AdminSignupSuccessPage onNavigate={navigate} />
                )}
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
                {showProfileSelection && (
                    <ConsumerProfileSelectionPage onNavigate={navigate} />
                )}
                {showLogin && (
                    <LoginPage
                        recovered={justRecovered}
                        fromContact={fromContact}
                        profile={loginProfile}
                        registered={justRegistered}
                        onNavigate={navigate}
                        onSignIn={handleSignIn}
                    />
                )}
                {path === "/cadastro" && <RegisterPage onNavigate={navigate} />}

                {path === "/recuperar-acesso" && (
                    <RecoverAccessPage
                        onNavigate={navigate}
                        getDemoLink={
                            isMockAuthEnabled ? getMockRecoveryLink : undefined
                        }
                    />
                )}
                {path === "/nova-senha" && (
                    <ResetPasswordPage
                        token={recoveryToken}
                        onNavigate={navigate}
                    />
                )}

                {path === "/cadastro/consumidor" && (
                    <ConsumerSignupPage
                        createAccount={registerConsumer}
                        onNavigate={navigate}
                    />
                )}
                {path === "/conta-criada/consumer" && (
                    <ConsumerSignupSuccessPage onNavigate={navigate} />
                )}
                {path === "/conta-criada/producer" && (
                    <ProducerSignupSuccessPage onNavigate={navigate} />
                )}
                {screenPath === "/conta" && (
                    <AccountPage
                        role={role}
                        consumerName={consumerName}
                        consumerEmail={email}
                        consumerCpf={cpf}
                        settings={settings}
                        draft={draft}
                        saved={saved}
                        onDraftChange={setDraft}
                        onSavedChange={setSaved}
                        onSaveContact={save}
                        onNavigate={navigate}
                        onSignOut={() => {
                            signOut();
                            navigate("/escolher-perfil");
                        }}
                    />
                )}
            </main>
            {!isAuthFlow && (
                <BottomNavigation
                    path={path}
                    role={role}
                    onNavigate={navigate}
                />
            )}
        </div>
    );
}

export default App;
