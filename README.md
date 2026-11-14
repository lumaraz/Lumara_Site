# Lumara Silva: site e sistema

Site público (portfólio, orçamento, página de links), portal do cliente (proposta, contrato, pagamento, aprovações, recibos) e área da equipe (pedidos, propostas, contratos, projetos, calendário, caixa).

## Como funciona

- **Netlify** publica as páginas e roda as funções em `netlify/functions` (endereços `/api/...`).
- **Supabase** guarda os dados (`supabase/schema.sql`), o login da equipe e as imagens (pasta `arquivos`).
- **Google Workspace** envia os e-mails (senha de app).
- **InfinitePay** (Checkout Integrado) recebe os pagamentos por Pix e cartão. Cada aviso de pagamento é conferido na própria InfinitePay antes de ser registrado.
- Todo dia às 9h a função `lembretes` avisa parcelas que vencem em até 3 dias e as atrasadas.

## Variáveis no Netlify (Site configuration → Environment variables)

| Nome | O que é |
| --- | --- |
| `SUPABASE_SECRET_KEY` | Chave secreta do Supabase (Project Settings → API Keys → Secret key). Nunca colocar no código. |
| `GMAIL_USER` | `contato@lumarasilva.com.br` |
| `GMAIL_APP_PASSWORD` | Senha de app do Google criada para o site. |
| `AVISOS_PARA` | (opcional) e-mail que recebe os avisos de pedido, aprovação e pagamento. Padrão: `GMAIL_USER`. |

## No Supabase, depois do primeiro deploy

Authentication → URL Configuration: em **Site URL** e em **Redirect URLs**, colocar o endereço do site (e `/admin/`), para o link de "Esqueci a senha" voltar ao lugar certo.
