# Protótipo navegável — Rede Cafuringa

Protótipo navegável para demonstração com o cliente. Existem duas versões com o mesmo conteúdo e as mesmas rotas:

| Versão | Pasta | Como rodar |
|---|---|---|
| Standalone (HTML/CSS/JS puro) | `protótipo navegável/` | servidor estático |
| React (fonte da sincronização com o Figma) | `protótipo navegável/react/` | Vite dev server |

Fluxos simulados nas duas versões:

- landing page institucional e de descoberta;
- missão, como funciona, contato e perfis de anfitrião/produtor;
- catálogos de produtos, experiências, trilhas, pousadas e workshops;
- mapa com Leaflet/OpenStreetMap e localização aproximada;
- pré-reserva por tipo de oferta e status da reserva;
- Pix simulado de 50%;
- notificações e feedback privado;
- área do produtor e solicitações de cadastro;
- assistente determinístico simulado;
- consulta administrativa de usuários;
- login/recuperação simulados e tela 404.

## Executar — standalone

Na raiz do repositório:

```bash
python -m http.server 8080
```

Depois abra:

```text
http://localhost:8080/prot%C3%B3tipo%20naveg%C3%A1vel/
```

No Windows, se `python` não responder, use `py -3 -m http.server 8080`.

## Executar — React

```bash
cd "protótipo navegável/react"
npm install
npm run dev
```

Depois abra:

```text
http://localhost:5173
```

As rotas são por hash (`http://localhost:5173/#experiences`) e também aceitam `?route=experiences`, que tem prioridade — esse parâmetro existe para a captura no Figma.

### Comandos úteis (React)

```bash
npm run dev      # servidor de desenvolvimento (Vite)
npm run build    # build de produção em dist/
npm run lint     # ESLint
```

## Estrutura

```text
protótipo navegável/
├── assets/                 # tokens de design compartilhados (fonte da verdade)
│   ├── design-tokens.json  # registry revisado (primitive → semantic → component)
│   └── design-tokens.css   # CSS gerado — não editar manualmente
├── index.html              # protótipo standalone
├── styles.css
├── app.js
├── DESIGN.md               # contrato de design (direção, tokens, regras)
├── README.md               # este arquivo
└── react/                  # protótipo React (mesmas rotas/conteúdo)
    ├── index.html
    ├── package.json
    └── src/
```

Para regenerar o CSS de tokens após editar o JSON (na raiz do repositório):

```bash
node ".opencode/skills/design-system/scripts/generate-tokens.cjs" --config "protótipo navegável/assets/design-tokens.json" --output "protótipo navegável/assets/design-tokens.css" --force
```

Validar HTML contra os tokens:

```bash
set PYTHONUTF8=1
py -3 ".opencode/skills/design-system/scripts/html-token-validator.py" "protótipo navegável/index.html" -v
```

## Sincronização com o Figma

As telas do React foram capturadas na página `Protótipo pós MVP` (`17:2`) do arquivo:

```text
https://www.figma.com/design/O9biBXXgG3EQNpEbh4VDzC/
```

A página `Primeiro Protótipo` (`0:1`) é histórico legado e não deve ser alterada. O mapeamento rota → node está em `protótipo navegável/DESIGN.md`.

## Limites da demonstração

- O Pix é simulado (não há cobrança real).
- A localização é aproximada; pins são fictícios para demonstração.
- O assistente de IA é determinístico e não inventa preço, disponibilidade ou certificação.
- Feedback do visitante é privado.
- Nenhum dado é enviado para API ou persistido em backend.
- O mapa usa OpenStreetMap quando a rede está disponível e mantém fallback visual quando não está.
