import { describe, expect, it, vi } from "vitest";
import {
    prepareProfilePhoto,
    UPLOAD_MAX_DIMENSION,
    type PhotoResizeDeps,
} from "@/features/trajectory/photoResize";

const original = new File(["original"], "IMG_0001.jpeg", {
    type: "image/jpeg",
});

function fakes({
    width = 4000,
    height = 3000,
    blob = new Blob(["jpeg"], { type: "image/jpeg" }) as Blob | null,
    bitmapError = false,
} = {}) {
    const bitmap = { width, height, close: vi.fn() };
    const context = { drawImage: vi.fn() };
    const canvas = {
        width: 0,
        height: 0,
        getContext: vi.fn(() => context),
        toBlob: vi.fn((done: (b: Blob | null) => void) => done(blob)),
    };
    const deps: PhotoResizeDeps = {
        createImageBitmap: vi.fn(async () => {
            if (bitmapError) throw new Error("decode");
            return bitmap as unknown as ImageBitmap;
        }),
        createCanvas: () => canvas as unknown as HTMLCanvasElement,
    };
    return { deps, bitmap, canvas, context };
}

describe("HU12/RF12 — preparo da foto no aparelho (RNF06, RNF11)", () => {
    it("reduz para caber no limite, mantendo a proporção, e regrava em JPEG", async () => {
        const { deps, canvas, context, bitmap } = fakes();

        const result = await prepareProfilePhoto(original, deps);

        expect([canvas.width, canvas.height]).toEqual([
            UPLOAD_MAX_DIMENSION,
            UPLOAD_MAX_DIMENSION * 0.75,
        ]);
        expect(context.drawImage).toHaveBeenCalledWith(
            bitmap,
            0,
            0,
            canvas.width,
            canvas.height,
        );
        expect(canvas.toBlob).toHaveBeenCalledWith(
            expect.any(Function),
            "image/jpeg",
            0.85,
        );
        expect(result.type).toBe("image/jpeg");
        expect(result.name).toBe("foto.jpg");
        expect(bitmap.close).toHaveBeenCalled();
    });

    it("aplica a orientação do EXIF ao decodificar", async () => {
        const { deps } = fakes();

        await prepareProfilePhoto(original, deps);

        expect(deps.createImageBitmap).toHaveBeenCalledWith(original, {
            imageOrientation: "from-image",
        });
    });

    it("regrava mesmo fotos pequenas: os metadados (GPS) não saem do aparelho", async () => {
        const { deps, canvas } = fakes({ width: 800, height: 600 });

        const result = await prepareProfilePhoto(original, deps);

        expect([canvas.width, canvas.height]).toEqual([800, 600]);
        expect(result).not.toBe(original);
    });

    it.each([
        ["o navegador não decodifica a imagem", { bitmapError: true }],
        ["a regravação falha", { blob: null }],
    ])("envia o arquivo original quando %s", async (_case, options) => {
        const { deps } = fakes(options);

        await expect(prepareProfilePhoto(original, deps)).resolves.toBe(
            original,
        );
    });

    it("envia o original em navegadores sem createImageBitmap", async () => {
        const { deps } = fakes();

        await expect(
            prepareProfilePhoto(original, {
                ...deps,
                createImageBitmap: undefined,
            }),
        ).resolves.toBe(original);
    });

    it("envia o original quando o canvas não tem contexto 2D", async () => {
        const { deps, canvas } = fakes();
        canvas.getContext.mockReturnValue(null as never);

        await expect(prepareProfilePhoto(original, deps)).resolves.toBe(
            original,
        );
    });
});
