import { useCallback, useEffect, useState } from "react";
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
import { ProfilePage } from "@/features/profile";
import { ExplorePage } from "@/features/profile/ExplorePage";
import type { AuthResult } from "@/shared/types";
import {
    rememberOfferOrigin,
    offerReturnRoute,
} from "@/features/offers/offerNavigation";
import { useHashRoute } from "./useHashRoute";
import { RegisterPage } from "@/features/register";
import "../App.css";
import { isMockAuthEnabled } from "@/features/auth/authMode";
import { DemoNavigation } from "@/features/auth/DemoNavigation";
import { RecoverAccessPage, ResetPasswordPage } from "@/features/recovery";
import { getMockRecoveryLink } from "@/features/recovery/mockRecovery";
import { AdminUsersPage } from "@/features/users/AdminUsersPage";
import { TrajectoryPage } from "@/features/trajectory/TrajectoryPage";
import { TrajectoryForm } from "@/features/trajectory/TrajectoryForm";
import { PublicTrajectoryPage } from "@/features/trajectory/PublicTrajectoryPage";
import { useProducerSignup } from "@/features/trajectory/useProducerSignup";
import {
    CatalogPage,
    offers,
    OfferDetailsPage,
    ProductCatalog,
    ProductOfferDetails,
} from "@/features/offers";
import { ProductRegistrationPage } from "@/features/offers/ProductRegistrationPage";
import { ProductPublishedPage } from "@/features/offers/ProductPublishedPage";
import type { RegisteredExperience } from "@/features/offers/experienceService";
import type { RegisteredProduct } from "@/features/offers/productService";
import { apiResourceUrl } from "@/shared/api";
import { BookingRoutePage } from "@/features/bookings/BookingRoutePage";
import { BookingSentPage } from "@/features/bookings/BookingSentPage";
import {
    BOOKING_SENT_ROUTE,
    BOOKINGS_LIST_ROUTE,
    bookingAccess,
    bookingLoginRoute,
    bookingReturnRoute,
    bookingRoute,
    canRequestBooking,
    experienceDetailsRoute,
    parseBookingRoute,
} from "@/features/bookings/bookingRoutes";

export function App() {
    const [exploreCategory, setExploreCategory] = useState("Produtos");
    const [exploreSearch, setExploreSearch] = useState("");
    const [publishedProducts, setPublishedProducts] = useState<
        (RegisteredProduct | RegisteredExperience)[]
    >([]);
    const { route, navigate: changeRoute } = useHashRoute();
    const navigate = useCallback(
        (next: string) => {
            rememberOfferOrigin(next, route);
            changeRoute(next);
        },
        [route, changeRoute],
    );
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
    const published = publishedProducts.at(-1);
    const catalogOffers = [
        ...publishedProducts.map((product) => ({
            id: product.id,
            title: product.nome,
            category: product.categoria,
            image: product.fotos[0]
                ? isMockAuthEnabled && /^data:image\//.test(product.fotos[0])
                    ? product.fotos[0]
                    : apiResourceUrl(product.fotos[0])
                : "",
            price: `${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format("valorPorPessoa" in product ? product.valorPorPessoa : product.precoPorUnidade)} / ${"valorPorPessoa" in product ? "pessoa" : "unidade"}`,
            details: [
                `Produtor: ${product.produtor.nomeIniciativa}`,
                // HU20 CA03 / HU21 CA08: propriedade divulgada pelo responsável.
                ...("localidade" in product.produtor &&
                product.produtor.localidade
                    ? [`Propriedade: ${product.produtor.localidade}`]
                    : []),
                ...("local" in product
                    ? [product.local, product.duracao]
                    : [`${product.gramasPorUnidade} g por unidade`]),
            ],
            description: product.descricao,
        })),
        // Ofertas fictícias só na demonstração; com a API real o catálogo
        // mostra apenas o que os produtores cadastraram (HU19 CA02).
        ...(isMockAuthEnabled ? offers : []),
    ];
    useEffect(() => {
        if (path === "/oferta-publicada" && !published) navigate("/catalogo");
    }, [path, published, navigate]);
    const isExperienceRegisterRoute = path === "/experiencias/nova";
    const isOfferRegisterRoute = [
        "/produtos/novo",
        "/experiencias/nova",
    ].includes(path);
    const productBlocked =
        isOfferRegisterRoute &&
        (role !== "producer" || !localStorage.getItem("cafuringa-token"));
    useEffect(() => {
        if (productBlocked) navigate(role ? "/conta" : "/login/producer");
    }, [productBlocked, role, navigate]);
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
    const justRecovered = query.get("recuperacao") === "ok";
    const recoveryToken = query.get("token");
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
    // HU44 CA02: só consumidor autenticado abre o formulário de pré-reserva.
    const bookingExperienceId = parseBookingRoute(path);
    const bookingAccessState = bookingExperienceId
        ? bookingAccess({
              role,
              hasToken: !!localStorage.getItem("cafuringa-token"),
              mock: isMockAuthEnabled,
          })
        : null;
    useEffect(() => {
        if (!bookingExperienceId) return;
        if (bookingAccessState === "login")
            navigate(bookingLoginRoute(bookingExperienceId));
        if (bookingAccessState === "blocked") navigate("/conta");
    }, [bookingExperienceId, bookingAccessState, navigate]);
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
        path === "/oferta-publicada" ||
        path.startsWith("/admin/") ||
        path === "/cadastro/administrador" ||
        path === "/conta-criada/admin" ||
        showProfileSelection ||
        showLogin ||
        path === "/cadastro/consumidor" ||
        path === "/conta-criada/consumer" ||
        path === "/conta-criada/producer" ||
        path === "/cadastro/trajetoria" ||
        path === "/recuperar-acesso" ||
        path === "/nova-senha" ||
        path === "/cadastro";
    const offerId = path.startsWith("/oferta/")
        ? path.split("/").filter(Boolean)[1]
        : undefined;
    const currentOffer = catalogOffers.find(
        (offer) => offer.id === offerId && offer.category.startsWith("Experi"),
    );
    const productOfferId = offerId && !currentOffer ? offerId : undefined;
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

        const bookingReturn = bookingReturnRoute(route, nextRole);
        if (bookingReturn) {
            navigate(bookingReturn);
            return;
        }

        if (subjectId?.startsWith("produto/")) {
            navigate(
                `/oferta/${encodeURIComponent(subjectId.slice("produto/".length))}?falar=1`,
            );
            return;
        }

        // Experiência (HU21) volta para a rota de experiência, não a de produto.
        if (subjectId?.startsWith("experiencia/")) {
            navigate(
                `/oferta/${encodeURIComponent(subjectId.slice("experiencia/".length))}?tipo=experiencia&falar=1`,
            );
            return;
        }

        // O contato público sempre é revalidado no perfil, nunca nas configurações locais.
        if (subjectId?.startsWith("produtor/")) {
            navigate(`/${subjectId}`);
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
        <div
            className={`app-shell ${isAuthFlow ? "auth-shell" : ""} ${path === "/explorar" || path === "/perfil" || path.startsWith("/produtor/") ? "public-profile-shell" : ""}`}
        >
            <BrandHeader
                onHome={() => navigate("/explorar")}
                onLogin={
                    path === "/explorar" && !role
                        ? () => navigate("/escolher-perfil")
                        : undefined
                }
            />
            {isMockAuthEnabled && (
                <DemoNavigation onNavigate={navigate} onSignIn={signIn} />
            )}
            <main className="main-content">
                {path === "/explorar" && (
                    <ExplorePage
                        onNavigate={navigate}
                        initialCategory={exploreCategory}
                        initialSearch={exploreSearch}
                        onCategoryChange={setExploreCategory}
                        onSearchChange={setExploreSearch}
                    />
                )}
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
                    <CatalogPage
                        offers={
                            role === "producer"
                                ? catalogOffers.filter((offer) =>
                                      publishedProducts.some(
                                          (item) => item.id === offer.id,
                                      ),
                                  )
                                : catalogOffers
                        }
                        onNavigate={navigate}
                        canRegisterProduct={
                            role === "producer" &&
                            !!localStorage.getItem("cafuringa-token")
                        }
                    />
                )}
                {isOfferRegisterRoute && !productBlocked && (
                    <ProductRegistrationPage
                        key="offer-registration"
                        initialCategory={
                            isExperienceRegisterRoute
                                ? "Experiência"
                                : "Produtos"
                        }
                        onNavigate={navigate}
                        onPublished={(product) => {
                            setPublishedProducts((previous) => [
                                ...previous.filter(
                                    (item) => item.id !== product.id,
                                ),
                                product,
                            ]);
                            navigate("/oferta-publicada");
                        }}
                    />
                )}
                {path === "/oferta-publicada" && published && (
                    <ProductPublishedPage
                        id={published.id}
                        onNavigate={navigate}
                    />
                )}
                {path === "/experiencias" && (
                    <ProductCatalog
                        key="experiences"
                        category="Experiências"
                        onNavigate={navigate}
                    />
                )}
                {path === "/produtos" && (
                    <ProductCatalog key="products" onNavigate={navigate} />
                )}
                {currentOffer && (
                    <OfferDetailsPage
                        offer={currentOffer}
                        backRoute={offerReturnRoute(route, "/catalogo")}
                        contactAvailable={contactAvailable}
                        onNavigate={navigate}
                        onStartContact={() =>
                            startContact(currentOffer.id, currentOffer.title)
                        }
                        onRequestBooking={
                            canRequestBooking(role)
                                ? () => navigate(bookingRoute(currentOffer.id))
                                : undefined
                        }
                    />
                )}
                {productOfferId && (
                    <ProductOfferDetails
                        key={route}
                        consumer={role === "consumer"}
                        bookingAvailable={canRequestBooking(role)}
                        resumeContact={query.get("falar") === "1"}
                        experience={query.get("tipo") === "experiencia"}
                        backPath={offerReturnRoute(
                            route,
                            query.get("tipo") === "experiencia"
                                ? "/experiencias"
                                : "/produtos",
                        )}
                        id={productOfferId}
                        onNavigate={navigate}
                    />
                )}
                {bookingExperienceId && bookingAccessState === "allowed" && (
                    <BookingRoutePage
                        key={bookingExperienceId}
                        experienceId={bookingExperienceId}
                        onBack={() =>
                            navigate(
                                experienceDetailsRoute(bookingExperienceId),
                            )
                        }
                        onSent={() => navigate(BOOKING_SENT_ROUTE)}
                    />
                )}
                {path === BOOKING_SENT_ROUTE && (
                    <BookingSentPage
                        onBack={() => navigate("/experiencias")}
                        onTrack={() => navigate(BOOKINGS_LIST_ROUTE)}
                        onContinue={() => navigate("/explorar")}
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
                        recovered={justRecovered}
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
                        catalogView={query.get("catalogo") === "1"}
                        offerId={query.get("oferta") ?? undefined}
                        consumer={role === "consumer"}
                    />
                )}

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
