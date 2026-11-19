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
    createWhatsAppUrl,
    isWhatsAppContactAvailable,
    useContactSettings,
    whatsAppContactUrl,
} from "@/features/contact";
import { ProfilePage } from "@/features/profile";
import { demoPublicProfiles } from "@/features/profile/publicProfileDemo";
import { ExplorePage } from "@/features/profile/ExplorePage";
import type { AuthResult } from "@/shared/types";
import {
    offerDetailsRoute,
    rememberOfferOrigin,
    offerReturnRoute,
} from "@/features/offers/offerNavigation";
import { contactReturnRoute, postLoginRoute } from "./postLoginRoute";
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
    const signup = useProducerSignup(
        (auth) => {
            signIn(auth);
            navigate("/conta-criada/producer");
        },
        () => navigate("/cadastro"),
    );
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
                `Produtora: ${product.produtor.nomeIniciativa}`,
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
    const contactSubject =
        path === "/entrar" || path.startsWith("/login/")
            ? query.get("contato")
            : null;
    const fromContact = Boolean(contactSubject);
    useEffect(() => {
        if (role && contactSubject)
            changeRoute(postLoginRoute(role, contactSubject));
    }, [role, contactSubject, changeRoute]);
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
    const needsProfileSelection =
        role === null &&
        ["/conta", "/notificacoes", "/reservas"].includes(path);
    const screenPath = needsProfileSelection ? "/escolher-perfil" : path;
    const showProfileSelection = screenPath === "/escolher-perfil";
    const showLogin =
        (screenPath === "/entrar" || path.startsWith("/login/")) &&
        !(role && fromContact);
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
    const currentOffer = isMockAuthEnabled
        ? offers.find(
              (offer) =>
                  offer.id === offerId && offer.category.startsWith("Experi"),
          )
        : undefined;
    const productOfferId = offerId && !currentOffer ? offerId : undefined;
    const canViewContact = Boolean(
        role && localStorage.getItem("cafuringa-token"),
    );
    // HU39: o contato salvo no aparelho só existe na demonstração (sem API).
    // Com a API real, o contato vem do perfil público do responsável (RN07).
    // Enquanto o produtor de teste não informou um número na Conta, a
    // demonstração usa o telefone autorizado do perfil público fictício do
    // responsável, o mesmo das ofertas da demonstração.
    const demoContactUrl = (
        subject: string,
        producerId: string,
        context: NonNullable<Parameters<typeof whatsAppContactUrl>[2]>,
    ) => {
        if (!isMockAuthEnabled || !canViewContact) return undefined;
        if (!settings.whatsappNumber)
            return whatsAppContactUrl(
                demoPublicProfiles.find((profile) => profile.id === producerId)
                    ?.telefone,
                subject,
                context,
            );
        return isWhatsAppContactAvailable(
            settings.authorized,
            settings.whatsappNumber,
        )
            ? createWhatsAppUrl(settings.whatsappNumber, subject, context)
            : undefined;
    };

    const handleSignIn = (auth: AuthResult) => {
        signIn(auth);
        changeRoute(postLoginRoute(auth.user.role, contactSubject));
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
                        contactUrl={demoContactUrl(
                            "Perfil de Dona Maria",
                            "demo-dona-maria",
                            { kind: "profile", route: "/perfil" },
                        )}
                        onNavigate={navigate}
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
                        experience={"valorPorPessoa" in published}
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
                        contactLoginSubject={
                            canViewContact
                                ? undefined
                                : `experiencia/${currentOffer.id}`
                        }
                        producerName="Jefferson Sooma"
                        producerRoute="/produtor/demo-jefferson"
                        backRoute={offerReturnRoute(route, "/catalogo")}
                        contactUrl={demoContactUrl(
                            currentOffer.title,
                            // Anfitrião das experiências de demonstração (listExperiences).
                            "demo-jefferson",
                            {
                                kind: "experience",
                                route: offerDetailsRoute(currentOffer.id, true),
                            },
                        )}
                        onNavigate={navigate}
                    />
                )}
                {productOfferId && (
                    <ProductOfferDetails
                        key={route}
                        canViewContact={canViewContact}
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
                        backPath={contactReturnRoute(contactSubject)}
                        profile={loginProfile}
                        registered={justRegistered}
                        onNavigate={navigate}
                        onSignIn={handleSignIn}
                    />
                )}
                {path === "/cadastro" && !lockedSignup && (
                    <RegisterPage
                        initialValues={signup.details ?? undefined}
                        initialFailure={signup.duplicate}
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
                    <TrajectoryPage
                        onNavigate={navigate}
                        userId={userId}
                        focusContact={query.get("contato") === "1"}
                    />
                )}
                {path.startsWith("/produtor/") && (
                    <PublicTrajectoryPage
                        key={path}
                        canViewContact={canViewContact}
                        id={path.split("/")[2]}
                        onNavigate={navigate}
                        catalogView={query.get("catalogo") === "1"}
                        offerId={query.get("oferta") ?? undefined}
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
                        userId={userId}
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
