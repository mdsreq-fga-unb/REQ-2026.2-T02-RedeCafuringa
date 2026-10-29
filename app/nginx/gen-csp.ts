// Gera o trecho de configuração do nginx com a CSP. Usado no build do Docker:
//   VITE_API_URL=https://api.exemplo.com/api/v1 node nginx/gen-csp.ts > csp.conf
import { cspSnippet } from "./csp.ts";

process.stdout.write(cspSnippet({ apiUrl: process.env.VITE_API_URL }));
