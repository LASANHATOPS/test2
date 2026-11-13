const { Client, GatewayIntentBits } = require("discord.js");

const ids = value => (value || "").split(",").map(id => id.trim()).filter(Boolean);
const openers = { roles: ids(process.env.BSSU_OPENER_ROLE_IDS), users: ids(process.env.BSSU_OPENER_USER_IDS) };
const builders = ids(process.env.BSSU_BUILDER_ROLE_IDS);
const pollHours = Math.min(Math.max(Number.parseInt(process.env.BSSU_POLL_DURATION_HOURS || "24", 10) || 24, 1), 168);
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const hasRole = (interaction, roleIds) => Boolean(interaction.member?.roles?.cache) && roleIds.some(id => interaction.member.roles.cache.has(id));
const canOpen = interaction => openers.users.includes(interaction.user.id) || hasRole(interaction, openers.roles);
const mentions = () => [...openers.roles.map(id => `<@&${id}>`), ...openers.users.map(id => `<@${id}>`)].join(" ");
async function channelFor(id, fallback) {
  if (!id) return fallback;
  const channel = await client.channels.fetch(id);
  if (!channel?.isTextBased()) throw new Error("Configured BSSU channel is not text-based.");
  return channel;
}

client.once("ready", () => console.log(`BSSU bot online: ${client.user.tag}`));
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (!openers.roles.length && !openers.users.length) return interaction.reply({ content: "❌ Configure os responsáveis de BSSU no Render primeiro.", ephemeral: true });
  try {
    if (interaction.commandName === "marcar-bssu") {
      if (!canOpen(interaction)) return interaction.reply({ content: "❌ Você não pode marcar BSSU.", ephemeral: true });
      const channel = await channelFor(process.env.BSSU_POLL_CHANNEL_ID, interaction.channel);
      const horario = interaction.options.getString("horario") || "a definir";
      await channel.send({ poll: { question: { text: `📅 BSSU — disponibilidade (${horario})` }, answers: [{ poll_media: { text: "✅ Consigo participar" } }, { poll_media: { text: "❌ Não consigo participar" } }, { poll_media: { text: "🤔 Talvez" } }], duration: pollHours, allow_multiselect: false } });
      return interaction.reply({ content: `✅ Enquete enviada em ${channel}.`, ephemeral: true });
    }
    if (interaction.commandName === "pedir-bssu") {
      if (!builders.length) return interaction.reply({ content: "❌ Configure o cargo Builder no Render primeiro.", ephemeral: true });
      if (!hasRole(interaction, builders)) return interaction.reply({ content: "❌ Apenas Builders podem pedir uma BSSU.", ephemeral: true });
      const channel = await channelFor(process.env.BSSU_REQUEST_CHANNEL_ID, interaction.channel);
      const motivo = interaction.options.getString("motivo") || "Nenhum detalhe informado.";
      await channel.send({ content: `${mentions()}\n📨 **Pedido de BSSU** por ${interaction.user}\n${motivo}`, allowedMentions: { roles: openers.roles, users: openers.users } });
      return interaction.reply({ content: `✅ Pedido enviado em ${channel}.`, ephemeral: true });
    }
    if (interaction.commandName === "abrir-bssu") {
      if (!canOpen(interaction)) return interaction.reply({ content: "❌ Você não pode abrir BSSU.", ephemeral: true });
      const channel = await channelFor(process.env.BSSU_ANNOUNCEMENT_CHANNEL_ID, interaction.channel);
      const detalhes = interaction.options.getString("detalhes") || "Entrem no servidor para participar.";
      await channel.send({ content: `@everyone\n🏗️ **BSSU ABERTA!**\n${detalhes}\n\nAberta por ${interaction.user}.`, allowedMentions: { parse: ["everyone"] } });
      return interaction.reply({ content: `✅ Anúncio enviado em ${channel}.`, ephemeral: true });
    }
    return interaction.reply({ content: "❌ Comando desconhecido.", ephemeral: true });
  } catch (error) {
    console.error("BSSU command failed:", error);
    return interaction.reply({ content: "❌ Não consegui concluir o comando. Confira canais e permissões.", ephemeral: true });
  }
});
if (!process.env.DISCORD_TOKEN) throw new Error("Missing DISCORD_TOKEN environment variable.");
client.login(process.env.DISCORD_TOKEN);
