/**
 * Preparo da foto de perfil no aparelho, antes do envio (HU12/RF12).
 *
 * - RNF06: a foto de um celular tem de 3 a 8 MB; reduzida, fica em centenas de
 *   KB, o que faz diferença numa conexão rural.
 * - RNF11: regravar a imagem no canvas descarta o EXIF, então a localização
 *   GPS da propriedade nem sai do aparelho. (A API também remove, por garantia.)
 *
 * Se o navegador não conseguir decodificar ou regravar, envia o arquivo
 * original: a API valida e processa de qualquer forma.
 */

/** Maior lado enviado. A API publica até 960 px; a folga preserva qualidade. */
export const UPLOAD_MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.85;

export type PhotoResizeDeps = {
    createImageBitmap?: (
        image: Blob,
        options?: ImageBitmapOptions,
    ) => Promise<ImageBitmap>;
    createCanvas: () => HTMLCanvasElement;
};

const browserDeps = (): PhotoResizeDeps => ({
    createImageBitmap:
        typeof createImageBitmap === "function"
            ? (image, options) => createImageBitmap(image, options)
            : undefined,
    createCanvas: () => document.createElement("canvas"),
});

export async function prepareProfilePhoto(
    file: File,
    deps: PhotoResizeDeps = browserDeps(),
): Promise<File> {
    if (!deps.createImageBitmap) return file;

    let bitmap: ImageBitmap;
    try {
        bitmap = await deps.createImageBitmap(file, {
            imageOrientation: "from-image",
        });
    } catch {
        return file;
    }

    try {
        const scale = Math.min(
            1,
            UPLOAD_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height),
        );
        const canvas = deps.createCanvas();
        canvas.width = Math.round(bitmap.width * scale);
        canvas.height = Math.round(bitmap.height * scale);
        const context = canvas.getContext("2d");
        if (!context) return file;
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

        const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
        );
        return blob
            ? new File([blob], "foto.jpg", { type: "image/jpeg" })
            : file;
    } finally {
        bitmap.close();
    }
}
