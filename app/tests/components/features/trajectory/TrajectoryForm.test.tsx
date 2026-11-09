import { useState } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { TrajectoryForm } from "@/features/trajectory/TrajectoryForm";
import {
    emptyTrajectory,
    TEXT_LIMIT,
} from "@/features/trajectory/trajectoryModel";

afterEach(cleanup);

function Form() {
    const [draft, setDraft] = useState({
        ...emptyTrajectory,
        story: "a".repeat(TEXT_LIMIT - 1),
        activities: "a".repeat(TEXT_LIMIT - 1),
    });
    return (
        <TrajectoryForm
            draft={draft}
            onChange={setDraft}
            onSubmit={async () => {}}
            onBack={vi.fn()}
        />
    );
}

it.each([/^Minha Trajetória/i, /^Produção\s*\/\s*Experiências/i])(
    "limita a digitação e a colagem a 2000 caracteres no campo %s",
    async (label) => {
        const user = userEvent.setup();
        render(<Form />);
        const field = screen.getByLabelText(label) as HTMLTextAreaElement;
        expect(field.maxLength).toBe(TEXT_LIMIT);
        await user.type(field, "xyz");
        expect(field.value).toBe("a".repeat(TEXT_LIMIT - 1) + "x");
        await user.clear(field);
        await user.paste("b".repeat(TEXT_LIMIT + 100));
        expect(field.value).toBe("b".repeat(TEXT_LIMIT));
    },
);
