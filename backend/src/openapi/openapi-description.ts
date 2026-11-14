/**
 * Textos da documentação da API (Swagger UI e shared/openapi.json).
 *
 * A descrição é a primeira coisa que quem integra lê: começa pelo caminho
 * mínimo para fazer a primeira chamada e só depois traz as convenções.
 * Markdown simples (o Swagger UI renderiza títulos, listas e tabelas).
 */

export const OPENAPI_TITLE = 'Rede Cafuringa API';

export const OPENAPI_DESCRIPTION = `API REST da plataforma **Rede Cafuringa**: produtores rurais da Cafuringa divulgam a produção, e consumidores e visitantes descobrem ofertas da região.

### Primeiros passos

1. **Entre:** em **auth › POST /auth/login**, clique em *Try it out* e envie e-mail e senha. A resposta traz \`accessToken\`.
2. **Autorize:** clique em **Authorize** (botão com cadeado, logo abaixo desta apresentação), cole o token e confirme. Ele fica salvo neste navegador até você clicar em *Logout*.
3. **Teste:** abra qualquer rota, *Try it out* e *Execute*. Rotas com cadeado exigem login; as demais são públicas.

Use o campo de busca (*Filter by tag*) para ir direto a um grupo.

### Perfis de acesso (RN01, RNF08)

| Perfil | O que pode fazer |
|---|---|
| Visitante (sem login) | Ler perfis públicos, catálogo e produtos; cadastrar-se; recuperar acesso |
| \`CONSUMIDOR\` | O mesmo que o visitante, com sessão |
| \`PRODUTOR\` | Registrar trajetória e foto de perfil; cadastrar produtos |
| \`ADMINISTRADOR\` | Consultar usuários e cadastrar outros administradores |

Toda rota exige login, exceto as marcadas como públicas (negação por padrão). Perfil sem permissão recebe **403**; sem token ou com token inválido, **401**.

### Convenções

| Tema | Como funciona |
|---|---|
| **Erros** | Corpo \`ErrorResponse\` (\`statusCode\`, \`message\`, \`error\`). Em validação (400), \`message\` é uma lista de orientações em português, prontas para exibir |
| **Paginação** | Listas devolvem \`{ itens, total, pagina, limite }\`; use \`?pagina=\` e \`?limite=\` |
| **Fotos** | Envio em \`multipart/form-data\`. PNG, JPEG ou WebP; a API regrava em WebP **sem metadados** (EXIF/GPS). Os caminhos devolvidos são relativos à base da API e levam a versão: podem ficar em cache para sempre |
| **Reenvio seguro** | \`POST /products\` aceita \`Idempotency-Key\`: repetir com a mesma chave após uma queda de conexão não duplica o cadastro |
| **Limites de uso** | Login, cadastro e recuperação de acesso têm limite de tentativas por IP: **429** com \`Retry-After\` (segundos) |
| **Rastreio** | Envie \`x-request-id\` (1 a 128 caracteres de \`A-Za-z0-9._-\`); ele volta na resposta e nos logs. Sem ele, a API gera um UUID |
| **Dados pessoais** | Respostas nunca trazem hash de senha nem CPF completo (vem mascarado). Perfis públicos só mostram dados de divulgação (RN07, RNF11) |
| **Versão** | SemVer em \`info.version\`; regras em *docs/shared/contratos.md*. Tipos do front gerados a partir deste contrato (\`./scripts/dev.sh contract\`) |`;

/** Grupos na ordem da jornada de uso; o Swagger UI mostra nesta ordem. */
export const OPENAPI_TAGS: ReadonlyArray<{
  name: string;
  description: string;
}> = [
  {
    name: 'auth',
    description:
      'Entrar, consultar a própria sessão e recuperar o acesso à conta (RN05, HU09, HU10)',
  },
  {
    name: 'users',
    description:
      'Cadastro de consumidor, produtor e administrador; consulta administrativa (RN02, RNF15, HU01–HU04)',
  },
  {
    name: 'producers',
    description:
      'Perfil do produtor: trajetória, atividades, contato e foto de perfil (HU12, RN07)',
  },
  {
    name: 'products',
    description:
      'Catálogo e cadastro de produtos, com galeria de fotos (HU15, RN09, RN11)',
  },
  {
    name: 'health',
    description:
      'Saúde do serviço, para o Docker, o deploy e monitores externos',
  },
];
