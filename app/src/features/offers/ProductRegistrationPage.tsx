import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { BackButton } from "@/components/navigation/BackButton";
import { ApiHttpError } from "@/shared/api";
import { PRODUCT_PHOTOS_MAX, registerProduct } from "./productService";
import type { ProductDraft, RegisteredProduct } from "./productService";
import "./product-registration.css";

type Errors = Partial<Record<keyof ProductDraft, string>>;
const initialDraft: ProductDraft = {
    nome: "",
    categoria: "Produtos",
    descricao: "",
    preco: "",
    gramas: "",
    fotos: [],
};

function validate(draft: ProductDraft): Errors {
    const errors: Errors = {};
    if (!draft.nome.trim()) errors.nome = "Informe o nome do produto.";
    if (!["Produtos", "Experiência"].includes(draft.categoria))
        errors.categoria = "Selecione uma categoria válida.";
    if (!draft.descricao.trim())
        errors.descricao = "Informe a descrição do produto.";
    if (
        !draft.preco.trim() ||
        !Number.isFinite(Number(draft.preco)) ||
        Number(draft.preco) < 0
    )
        errors.preco = "Informe um preço válido, maior ou igual a zero.";
    if (
        !draft.gramas.trim() ||
        !Number.isFinite(Number(draft.gramas)) ||
        Number(draft.gramas) <= 0
    )
        errors.gramas =
            "Informe as gramas por unidade, com peso maior que zero.";
    if (!draft.fotos.length)
        errors.fotos = "Adicione ao menos uma foto do produto.";
    else if (draft.fotos.length > PRODUCT_PHOTOS_MAX)
        errors.fotos = `Adicione no máximo ${PRODUCT_PHOTOS_MAX} fotos.`;
    // O tamanho não é conferido aqui: o envio reduz cada foto no aparelho
    // (prepareProfilePhoto) e a API devolve 413 se ainda passar do limite.
    return errors;
}

/** Identificador do preenchimento atual; muda quando o produtor edita algo. */
function newIdempotencyKey() {
    return crypto.randomUUID();
}

/** Mensagem para a falha da API, mantendo a orientação do servidor (RNF03). */
function failureMessage(error: unknown): string {
    const kept = "Os dados preenchidos foram preservados.";
    if (!(error instanceof ApiHttpError))
        return "Não foi possível concluir o cadastro. Verifique sua conexão e tente novamente. Os dados e fotos foram preservados.";
    switch (error.status) {
        case 401:
            return "Sua sessão expirou. Entre novamente como produtor. Os dados preenchidos foram preservados nesta tela.";
        case 403:
            return `Seu perfil não tem permissão para cadastrar produtos. ${kept}`;
        case 404:
            return `Sua conta de produtor não está ativa. Fale com a administração da rede. ${kept}`;
        case 400:
        case 413:
        case 415: {
            const detail = error.details.length
                ? error.details.join(" ")
                : error.message;
            return `Cadastro não concluído. ${detail || "Confira os dados do produto e tente novamente."} ${kept}`;
        }
        default:
            return "Não foi possível concluir o cadastro. Verifique sua conexão e tente novamente. Os dados e fotos foram preservados.";
    }
}

function PhotoPreview({ file }: { file: File }) {
    const image = useRef<HTMLImageElement>(null);
    useEffect(() => {
        if (!URL.createObjectURL) return;
        const url = URL.createObjectURL(file);
        if (image.current) image.current.src = url;
        return () => URL.revokeObjectURL(url);
    }, [file]);
    return <img ref={image} alt={`Foto selecionada: ${file.name}`} />;
}

export function ProductRegistrationPage({
    onNavigate,
    onPublished,
}: {
    onNavigate: (path: string) => void;
    onPublished: (product: RegisteredProduct) => void;
}) {
    const [draft, setDraft] = useState<ProductDraft>(initialDraft);
    const [errors, setErrors] = useState<Errors>({});
    const [failure, setFailure] = useState("");
    const [pending, setPending] = useState(false);
    const [dragging, setDragging] = useState(false);
    const submitting = useRef(false);
    const formRef = useRef<HTMLFormElement>(null);
    const photoInput = useRef<HTMLInputElement>(null);
    const idempotencyKey = useRef(newIdempotencyKey());

    function update<K extends keyof ProductDraft>(
        key: K,
        value: ProductDraft[K],
    ) {
        // Dados novos = cadastro novo; repetir sem editar reaproveita a chave (CA07).
        idempotencyKey.current = newIdempotencyKey();
        setDraft((previous) => ({ ...previous, [key]: value }));
        setErrors((previous) => ({ ...previous, [key]: undefined }));
        setFailure("");
    }

    async function save(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (submitting.current) return;
        const invalid = validate(draft);
        setErrors(invalid);
        setFailure("");
        if (Object.keys(invalid).length) {
            const firstKey = Object.keys(invalid)[0];
            formRef.current
                ?.querySelector<HTMLElement>(`[name="${firstKey}"]`)
                ?.focus();
            return;
        }
        submitting.current = true;
        setPending(true);
        try {
            onPublished(
                await registerProduct(draft, {
                    idempotencyKey: idempotencyKey.current,
                }),
            );
        } catch (error) {
            setFailure(failureMessage(error));
        } finally {
            submitting.current = false;
            setPending(false);
        }
    }

    function accessibility(key: keyof ProductDraft) {
        return {
            id: `product-${key}`,
            name: key,
            required: true,
            "aria-invalid": errors[key] ? true : undefined,
            "aria-describedby": errors[key]
                ? `product-error-${key}`
                : undefined,
        };
    }
    function errorFor(key: keyof ProductDraft) {
        return (
            errors[key] && (
                <p
                    className="product-field-error"
                    id={`product-error-${key}`}
                    role="alert"
                >
                    {errors[key]}
                </p>
            )
        );
    }

    return (
        <section
            className="product-registration"
            aria-labelledby="product-title"
        >
            <BackButton
                label="Voltar"
                onClick={() => onNavigate("/catalogo")}
            />
            <h1 id="product-title">Divulgue um produto</h1>
            <p className="product-intro">
                Dados essenciais para aparecer no catálogo.
            </p>
            <form ref={formRef} onSubmit={save} noValidate aria-busy={pending}>
                <fieldset disabled={pending}>
                    <div className="product-field">
                        <label htmlFor="product-nome">Nome *</label>
                        <input
                            {...accessibility("nome")}
                            value={draft.nome}
                            onChange={(e) => update("nome", e.target.value)}
                            placeholder="Ex.: Cesta de hortaliças da estação"
                            autoComplete="off"
                        />
                        {errorFor("nome")}
                    </div>
                    <div className="product-field">
                        <label htmlFor="product-categoria">Categoria *</label>
                        <select
                            {...accessibility("categoria")}
                            value={draft.categoria}
                            onChange={(e) =>
                                update("categoria", e.target.value)
                            }
                        >
                            <option value="Produtos">Produtos</option>
                            <option value="Experiência">Experiência</option>
                        </select>
                        {errorFor("categoria")}
                    </div>
                    <div className="product-field">
                        <label htmlFor="product-descricao">Descrição *</label>
                        <textarea
                            {...accessibility("descricao")}
                            value={draft.descricao}
                            onChange={(e) =>
                                update("descricao", e.target.value)
                            }
                            placeholder="Conte o que você oferece, como é produzido e o que está incluído. Ex.: cesta com hortaliças frescas cultivadas sem agrotóxicos."
                            rows={3}
                        />
                        {errorFor("descricao")}
                    </div>
                    <div className="product-field product-price">
                        <label htmlFor="product-preco">
                            Preço por unidade *
                        </label>
                        <input
                            {...accessibility("preco")}
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="0.01"
                            value={draft.preco}
                            onChange={(e) => update("preco", e.target.value)}
                            placeholder="Ex.: 40,00"
                        />
                        {errorFor("preco")}
                    </div>
                    <div className="product-field product-weight">
                        <label htmlFor="product-gramas">
                            Gramas por unidade *
                        </label>
                        <input
                            {...accessibility("gramas")}
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="any"
                            value={draft.gramas}
                            onChange={(e) => update("gramas", e.target.value)}
                            placeholder="Ex.: 500"
                        />
                        {errorFor("gramas")}
                    </div>
                    <div className="product-field product-photos">
                        <label htmlFor="product-fotos">Adicionar fotos *</label>
                        <div
                            className={`product-photo-picker${dragging ? " is-dragging" : ""}`}
                            onDragOver={(event) => {
                                event.preventDefault();
                                if (pending) return;
                                event.dataTransfer.dropEffect = "copy";
                                setDragging(true);
                            }}
                            onDragLeave={(event) => {
                                if (
                                    !event.currentTarget.contains(
                                        event.relatedTarget as Node | null,
                                    )
                                )
                                    setDragging(false);
                            }}
                            onDrop={(event) => {
                                event.preventDefault();
                                setDragging(false);
                                if (pending) return;
                                const files = Array.from(
                                    event.dataTransfer.files,
                                );
                                if (!files.length) return;
                                if (
                                    files.some(
                                        (file) =>
                                            !file.type.startsWith("image/"),
                                    )
                                ) {
                                    setErrors((previous) => ({
                                        ...previous,
                                        fotos: "Selecione apenas arquivos de imagem para as fotos.",
                                    }));
                                    return;
                                }
                                update("fotos", [...draft.fotos, ...files]);
                            }}
                        >
                            <input
                                {...accessibility("fotos")}
                                ref={photoInput}
                                type="file"
                                accept="image/*"
                                multiple
                                aria-describedby={[
                                    "product-photo-help",
                                    errors.fotos
                                        ? "product-error-fotos"
                                        : undefined,
                                ]
                                    .filter(Boolean)
                                    .join(" ")}
                                onChange={(e) =>
                                    update(
                                        "fotos",
                                        Array.from(e.target.files ?? []),
                                    )
                                }
                            />
                            <svg viewBox="0 0 52 52" aria-hidden="true">
                                <circle cx="26" cy="26" r="22" />
                                <path d="M26 12v28M12 26h28" />
                            </svg>
                            <span aria-hidden="true">
                                {dragging
                                    ? "Solte as fotos aqui"
                                    : "Arraste suas fotos aqui ou clique para selecionar"}
                            </span>
                        </div>
                        <p
                            className="product-photo-help"
                            id="product-photo-help"
                        >
                            Você pode selecionar várias imagens. Mostre os
                            detalhes da sua oferta.
                        </p>
                        {errorFor("fotos")}
                        {draft.fotos.length > 0 && (
                            <ul
                                className="product-photo-list"
                                aria-label="Fotos selecionadas"
                            >
                                {draft.fotos.map((file, index) => (
                                    <li key={`${file.name}-${index}`}>
                                        <PhotoPreview file={file} />
                                        <button
                                            type="button"
                                            aria-label={`Remover foto ${file.name}`}
                                            onClick={() => {
                                                update(
                                                    "fotos",
                                                    draft.fotos.filter(
                                                        (_, i) => i !== index,
                                                    ),
                                                );
                                                if (photoInput.current)
                                                    photoInput.current.value =
                                                        "";
                                            }}
                                        >
                                            Remover
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </fieldset>
                {failure && (
                    <p role="alert" className="product-field-error">
                        {failure}
                    </p>
                )}
                <button
                    className="product-submit"
                    disabled={pending}
                    type="submit"
                >
                    {pending ? "Adicionando produto…" : "Adicionar produto"}
                </button>
            </form>
        </section>
    );
}
