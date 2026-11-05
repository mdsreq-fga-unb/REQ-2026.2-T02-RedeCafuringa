# Demonstração local

## Ferramentas de desenvolvedor

Dentro de “Modo local · Explorar telas”:

- **Apagar usuários cadastrados:** remove cadastros locais de consumidor, produtor e administrador e encerra a sessão, preservando configurações.
- **Encerrar sessão de teste:** remove apenas a sessão atual.
- **Restaurar demonstração:** remove os cadastros, a sessão e as configurações locais de contato e perfil do produtor.

A exclusão de cadastros pede confirmação. As ações recarregam a página para limpar também os usuários mantidos em memória; as contas padrão de teste continuam disponíveis. Nenhuma ação chama a API ou apaga dados de outros aplicativos. O menu e as funções de limpeza ficam desativados quando `VITE_USE_MOCK_AUTH=false`.

No arquivo `app/.env.local` (ignorado pelo Git), defina `VITE_USE_MOCK_AUTH=true` e rode `npm run dev` dentro de `app`.

O menu “Modo local · Explorar telas” permite abrir as telas existentes e entrar com consumidor ou produtor de teste para acessar a conta. O acesso é por **e-mail e senha** (RN05). Consumidor: `ana@exemplo.com`; produtor: `produtor@exemplo.com`; administrador: `admin@exemplo.com`; senha de todos: `senha123`.

No modo local o login administrativo é real dentro do mock: só entra uma conta de administrador (a padrão ou uma cadastrada por ela). O cadastro de administrador (`/cadastro/administrador`) exige sessão de administrador, como na API, e simula duplicidade de e-mail com os cadastros salvos no navegador. Como o mock não tem servidor, a senha dos administradores criados fica no `localStorage` (só com `VITE_USE_MOCK_AUTH=true`).

Para voltar à API, altere para `VITE_USE_MOCK_AUTH=false` e reinicie o Vite. O menu e o login simulado desaparecem; os serviços voltam a usar a API. Configure também `VITE_API_URL` conforme o ambiente. O cadastro real usa `POST /users/admins` com o token do administrador logado; o primeiro administrador vem de `ADMIN_BOOTSTRAP_EMAIL`/`ADMIN_BOOTSTRAP_SENHA` no backend (ver [operação do backend](../docs/arquitetura/backend/operacao.md)).

Use dados fictícios: os cadastros locais de consumidor já existentes no app armazenam credenciais de teste no navegador. Os dados de demonstração não devem ser usados como contas reais.
