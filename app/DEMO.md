# Demonstração local

## Ferramentas de desenvolvedor

Dentro de “Modo local · Explorar telas”:

- **Apagar usuários cadastrados:** remove cadastros locais de consumidor, produtor e administrador e encerra a sessão, preservando configurações.
- **Encerrar sessão de teste:** remove apenas a sessão atual.
- **Restaurar demonstração:** remove os cadastros, a sessão e as configurações locais de contato e perfil do produtor.

A exclusão de cadastros pede confirmação. As ações recarregam a página para limpar também os usuários mantidos em memória; as contas padrão de teste continuam disponíveis. Nenhuma ação chama a API ou apaga dados de outros aplicativos. O menu e as funções de limpeza ficam desativados quando `VITE_USE_MOCK_AUTH=false`.

No arquivo `app/.env.local` (ignorado pelo Git), defina `VITE_USE_MOCK_AUTH=true` e rode `npm run dev` dentro de `app`.

O menu “Modo local · Explorar telas” permite abrir as telas existentes e entrar com consumidor ou produtor de teste para acessar a conta. Consumidor: CPF 529.982.247-25; produtor: CPF 111.444.777-35; senha: `senha123`.

O cadastro de administrador funciona sem sessão no modo local e simula duplicidade com e-mails salvos no navegador. Não salva a senha. O login administrativo é uma simulação explícita: aceita qualquer e-mail válido e senha de pelo menos 8 caracteres, inclusive os dados recém-cadastrados. A tela seguinte permite continuar o cadastro de administradores. Não há área de gestão implementada nesta HU.

Para voltar à API, altere para `VITE_USE_MOCK_AUTH=false` e reinicie o Vite. O menu e o login simulado desaparecem; os serviços voltam a usar a API. Configure também `VITE_API_URL` conforme o ambiente. O cadastro real de administradores ainda depende da rota proposta `POST /users/admins` e da autorização do backend.

Use dados fictícios: os cadastros locais de consumidor já existentes no app armazenam credenciais de teste no navegador. Os dados de demonstração não devem ser usados como contas reais.
