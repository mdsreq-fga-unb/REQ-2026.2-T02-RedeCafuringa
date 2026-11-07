import { useCallback, useEffect } from "react";
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
import { AdminUsersPage } from "@/features/users/AdminUsersPage";
import { TrajectoryPage } from "@/features/trajectory/TrajectoryPage";
import { TrajectoryForm } from "@/features/trajectory/TrajectoryForm";
import { PublicTrajectoryPage } from "@/features/trajectory/PublicTrajectoryPage";
import { useProducerSignup } from "@/features/trajectory/useProducerSignup";

export function App() {
    const { route, navigate } = useHashRoute();
    const { role, consumerName, email, cpf, userId, signIn, signOut } =
        useDemoSession();
    const signup = useProducerSignup((auth) => {
        signIn(auth);
        navigate("/conta-criada/producer");
    });
    const endAdminSession = useCallback(() => {
        signOut();
        navigate("/admin/entrar");
    }, [signOut, navigate]);
    const { settings, draft, setDraft, saved, setSaved, save } =
        useContactSettings();

    const path = route.split("?")[0];
    const trajectoryBlocked =
        path === "/minha-trajetoria" &&
        (role !== "producer" || !localStorage.getItem("cafuringa-token"));
    const missingSignup = path === "/cadastro/trajetoria" && !signup.details;
    const lockedSignup = path === "/cadastro" && signup.created;
    const { details: signupDetails, reset: resetSignup } = signup;
    useEffect(() => {
        if (trajectoryBlocked) navigate(role ? "/conta" : "/login/producer");
        if (missingSignup) navigate("/cadastro");
        if (lockedSignup) navigate("/cadastro/trajetoria");
    }, [trajectoryBlocked, missingSignup, lockedSignup, role, navigate]);
    useEffect(() => {
        if (
            path !== "/cadastro" &&
            path !== "/cadastro/trajetoria" &&
            signupDetails
        )
            resetSignup();
    }, [path, signupDetails, resetSignup]);
    const query = new URLSearchParams(route.split("?")[1] || "");
    const fromContact = query.has("contato");
    const justRegistered = query.get("cadastro") === "ok";
    // RN03/RNF08: cadastro e consulta são exclusivos de administradores.
    const usersRoute =
        path === "/admin/usuarios" || path.startsWith("/admin/usuarios/");
    const adminOnly =
        usersRoute ||
        path === "/cadastro/administrador" ||
        path === "/conta-criada/admin";
    const adminBlocked =
        adminOnly &&
        (role !== "admin" ||
            (usersRoute &&
                !isMockAuthEnabled &&
                !localStorage.getItem("cafuringa-token")));
    useEffect(() => {
        if (adminBlocked) navigate("/admin/entrar");
    }, [adminBlocked, navigate]);
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
        path === "/cadastro/trajetoria" ||
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
        if (nextRole === "admin") {
            navigate("/admin/acesso");
            return;
        }

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
                {usersRoute && !adminBlocked && (
                    <AdminUsersPage
                        key={path}
                        id={path.split("/")[3]}
                        onNavigate={navigate}
                        onUnauthorized={endAdminSession}
                    />
                )}
                {path === "/admin/acesso" && (
                    <AdminAccessPage
                        onNavigate={navigate}
                        authenticated={role === "admin"}
                    />
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
                    <ConsumerProfileSelectionPage
                        onNavigate={(nextPath) => {
                            if (nextPath === "/admin/acesso") signOut();
                            navigate(nextPath);
                        }}
                    />
                )}
                {showLogin && (
                    <LoginPage
                        fromContact={fromContact}
                        profile={loginProfile}
                        registered={justRegistered}
                        onNavigate={navigate}
                        onSignIn={handleSignIn}
                    />
                )}
                {path === "/cadastro" && !lockedSignup && (
                    <RegisterPage
                        initialValues={signup.details ?? undefined}
                        onNavigate={navigate}
                        onContinue={(values) => {
                            signup.start(values);
                            navigate("/cadastro/trajetoria");
                        }}
                    />
                )}
                {path === "/cadastro/trajetoria" && signup.details && (
                    <TrajectoryForm
                        signup
                        draft={signup.draft}
                        onChange={signup.setDraft}
                        onSubmit={signup.submit}
                        error={signup.error}
                        onBack={() => navigate("/cadastro")}
                        backDisabled={signup.created}
                    />
                )}
                {path === "/minha-trajetoria" && !trajectoryBlocked && (
                    <TrajectoryPage onNavigate={navigate} userId={userId} />
                )}
                {path.startsWith("/produtor/") && (
                    <PublicTrajectoryPage
                        key={path}
                        id={path.split("/")[2]}
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
                    <ProducerSignupSuccessPage
                        onNavigate={navigate}
                        authenticated={role === "producer"}
                    />
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
