// Gera docs/shared/api.md (referência dos endpoints) a partir de shared/openapi.json.
// Sem dependências. Uso: node scripts/gen-api-docs.mjs   (ou ./scripts/dev.sh contract)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const spec = JSON.parse(readFileSync(resolve(root, "shared/openapi.json"), "utf8"));
const schemas = spec.components?.schemas ?? {};
const METHODS = ["get", "post", "put", "patch", "delete"];

const refName = (ref) => ref.split("/").pop();
const cell = (text) => String(text ?? "").replace(/\|/g, "\\|").replace(/\s*\n+\s*/g, " ").trim();

function typeOf(prop) {
    if (prop.$ref) return `[${refName(prop.$ref)}](#${refName(prop.$ref).toLowerCase()})`;
    if (prop.enum) return prop.enum.map((v) => `\`${v}\``).join(" \\| ");
    if (prop.oneOf) return prop.oneOf.map(typeOf).join(" \\| ");
    if (prop.type === "array") return `${typeOf(prop.items ?? {})}[]`;
    return prop.type ?? "objeto";
}

function schemaTable(schema) {
    const required = new Set(schema.required ?? []);
    const rows = Object.entries(schema.properties ?? {}).map(([name, p]) => {
        const example = p.example !== undefined ? ` Ex.: \`${JSON.stringify(p.example)}\`.` : "";
        return `| \`${name}\` | ${typeOf(p)} | ${required.has(name) ? "sim" : "não"} | ${cell(p.description)}${example} |`;
    });
    return ["| Campo | Tipo | Obrigatório | Descrição |", "|---|---|---|---|", ...rows].join("\n");
}

const out = [];
out.push("# Referência da API", "");
out.push("> Gerado automaticamente de [`shared/openapi.json`](https://github.com/mdsreq-fga-unb/REQ-2026.2-T02-RedeCafuringa/blob/dev/shared/openapi.json) por `scripts/gen-api-docs.mjs`. **Não edite à mão**: mude os decorators do backend e rode `./scripts/dev.sh contract`.", "");
out.push(`**${spec.info.title}** · versão do contrato \`${spec.info.version}\` · servidor \`${spec.servers?.[0]?.url ?? ""}\``, "");
out.push(spec.info.description ?? "", "");

const tags = spec.tags ?? [];
for (const tag of tags) {
    out.push(`## ${tag.name}`, "", tag.description ?? "", "");
    for (const [path, item] of Object.entries(spec.paths)) {
        for (const method of METHODS) {
            const op = item[method];
            if (!op || !(op.tags ?? []).includes(tag.name)) continue;
            const secured = (op.security ?? []).some((s) => "bearer" in s);
            out.push(`### \`${method.toUpperCase()} ${path}\``, "");
            out.push(`**${op.summary}** · \`operationId: ${op.operationId}\` · ${secured ? "exige **Bearer JWT**" : "pública"}`, "");
            out.push(op.description ?? "", "");
            const bodyRef = op.requestBody?.content?.["application/json"]?.schema?.$ref;
            if (bodyRef) out.push("**Corpo da requisição:** " + typeOf({ $ref: bodyRef }), "");
            out.push("| Status | Descrição | Corpo |", "|---|---|---|");
            for (const [status, res] of Object.entries(op.responses)) {
                const s = res.content?.["application/json"]?.schema;
                const body = s ? (s.$ref ? typeOf(s) : "objeto (veja o contrato)") : "";
                const extra = res.headers?.["Retry-After"] ? " Cabeçalho `Retry-After`." : "";
                out.push(`| ${status} | ${cell(res.description)}${extra} | ${body} |`);
            }
            out.push("");
        }
    }
}

out.push("## Schemas", "");
for (const [name, schema] of Object.entries(schemas)) {
    out.push(`### ${name}`, "");
    if (schema.description) out.push(schema.description, "");
    out.push(schemaTable(schema), "");
}

const file = resolve(root, "docs/shared/api.md");
mkdirSync(dirname(file), { recursive: true });
writeFileSync(file, out.join("\n").replace(/\n{3,}/g, "\n\n") + "\n", "utf8");
console.log(`docs/shared/api.md: ${Object.keys(spec.paths).length} caminhos, ${Object.keys(schemas).length} schemas`);
