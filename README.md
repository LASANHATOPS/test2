# BSSU bot — Área-14

Este projeto hospeda a API de whitelist do Roblox e o bot do Discord no Render.

## Comandos BSSU

- `/marcar-bssu [horario]`: cria uma enquete nativa do Discord. Apenas responsáveis por BSSU.
- `/pedir-bssu [motivo]`: envia um pedido aos responsáveis. Apenas builders autorizados.
- `/abrir-bssu [detalhes]`: publica um anúncio com `@everyone`. Apenas responsáveis por BSSU.

Os comandos e a integração antigos de whitelist, morph, Roblox e GitHub foram removidos.

## Configuração no Render

Defina estas variáveis de ambiente com IDs do Discord, sem `@`, separados por vírgula quando houver mais de um. Os valores já separados em `.env.example` correspondem aos cargos e canais informados para a Área-14; copie-os para as variáveis do Render, nunca para um arquivo com token.

| Variável | Obrigatória | Uso |
| --- | --- | --- |
| `BSSU_OPENER_ROLE_IDS` | sim* | Cargos que podem marcar e abrir BSSU. |
| `BSSU_OPENER_USER_IDS` | sim* | Usuários individuais que podem marcar e abrir BSSU. |
| `BSSU_BUILDER_ROLE_IDS` | sim | Cargos que podem usar `/pedir-bssu`. |
| `BSSU_REQUEST_CHANNEL_ID` | não | Canal onde chegam os pedidos. Sem valor, usa o canal do comando. |
| `BSSU_ANNOUNCEMENT_CHANNEL_ID` | não | Canal do anúncio de abertura. Sem valor, usa o canal do comando. |
| `BSSU_POLL_CHANNEL_ID` | não | Canal da enquete. Sem valor, usa o canal do comando. |
| `BSSU_POLL_DURATION_HOURS` | não | Duração da enquete, de 1 a 168 horas; padrão: `24`. |

\* Preencha ao menos uma das duas variáveis de responsáveis.

O bot precisa das permissões **Ver canal**, **Enviar mensagens**, **Enviar mensagens em enquetes**, **Mencionar @everyone, @here e todos os cargos** e **Usar comandos de aplicativo** nos canais usados.

## Registrar comandos

Depois de subir as alterações para o GitHub, execute uma vez no serviço Render:

```bash
npm run deploy
```

Esse comando registra todos os slash commands no servidor definido por `DISCORD_GUILD_ID`.
