# Protótipo navegável React

## Executar

```bash
npm install
npm run dev
```

Verificações:

```bash
npm run lint
npm run test
npm run build
```

## Demonstração

- `welcome`: escolha consumidor, produtor ou admin.
- Consumidor: login → explorar → detalhe de experiência → pré-reserva → minhas pré-reservas.
- Produtor: login → painel → cadastrar oferta ou responder pré-reserva.
- Produtor: aceitar ou recusar uma pré-reserva → confirmação “Resposta enviada”; após o aceite também é possível cancelar por imprevisto, com motivo obrigatório e notificação ao consumidor.
- Cancelamento pelo produtor exige justificativa não vazia (mínimo de 10 caracteres), preservada no estado em memória e exibida apenas ao consumidor relacionado; reservas canceladas não aceitam novas ações.
- Admin: `#admin-select` → login admin → usuários cadastrados.
- Acesso direto a uma área incompatível mostra `Acesso restrito`.

Rotas de demonstração adicionais: `#admin-select`, `#forgot`, `#sent`, `#products`, `#experiences`, `#detail-mel`, `#detail-sabores`, `#detail-trilha`, `#reserve-sabores`, `#producer-profile`, `#contact`, `#user-producer` e `#user-consumer`.

Todos os dados são locais e simulados. Não há backend, autenticação real, e-mail real, WhatsApp externo, Pix, pagamentos, mapa operacional ou persistência remota. A pré-reserva é sempre distinta de uma reserva confirmada; aceite e cancelamento do produtor são simulados localmente e sincronizados entre as telas dos dois perfis durante a sessão.

Limitações conhecidas: validação de credenciais, logout, recuperação de nova senha e comparação visual com o Figma ainda dependem da próxima rodada de inspeção.
