const express = require("express");
const { Client, GatewayIntentBits, MessageFlags, REST, Routes, SlashCommandBuilder } = require("discord.js");

const ids = value => (value || "").split(",").map(id => id.trim()).filter(Boolean);
const openers = { roles: ids(process.env.BSSU_OPENER_ROLE_IDS), users: ids(process.env.BSSU_OPENER_USER_IDS) };
const builders = ids(process.env.BSSU_BUILDER_ROLE_IDS);
const pollHours = Math.min(Math.max(Number.parseInt(process.env.BSSU_POLL_DURATION_HOURS || "24", 10) || 24, 1), 168);
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const app = express();

const hasRole = (interaction, roleIds) => Boolean(interaction.member?.roles?.cache) && roleIds.some(id => interaction.member.roles.cache.has(id));
const canOpen = interaction => openers.users.includes(interaction.user.id) || hasRole(interaction, openers.roles);
const mentions = () => [...openers.roles.map(id => `<@&${id}>`), ...openers.users.map(id => `<@${id}>`)].join(" ");
async function channelFor(id, fallback) {
  if (!id) return fallback;
  const channel = await client.channels.fetch(id);
  if (!channel?.isTextBased()) throw new Error("Configured BSSU channel is not text-based.");
  return channel;
}

const commands = [
  new SlashCommandBuilder()
    .setName("marcar-bssu")
    .setDescription("Cria uma enquete com horários para a BSSU")
    .addStringOption(option => option.setName("horario_1").setDescription("Primeira opção de horário").setRequired(true))
    .addStringOption(option => option.setName("horario_2").setDescription("Segunda opção de horário").setRequired(false))
    .addStringOption(option => option.setName("horario_3").setDescription("Terceira opção de horário").setRequired(false))
    .addStringOption(option => option.setName("horario_4").setDescription("Quarta opção de horário").setRequired(false))
    .addStringOption(option => option.setName("horario_5").setDescription("Quinta opção de horário").setRequired(false)),
  new SlashCommandBuilder()
    .setName("pedir-bssu")
    .setDescription("Solicita a abertura de uma BSSU")
    .addStringOption(option => option.setName("motivo").setDescription("Explique o que será construído").setRequired(false)),
  new SlashCommandBuilder()
    .setName("abrir-bssu")
    .setDescription("Anuncia que uma BSSU foi aberta")
    .addStringOption(option => option.setName("nome").setDescription("Nome do servidor").setRequired(false))
    .addStringOption(option => option.setName("senha").setDescription("Senha do servidor").setRequired(false)),
].map(command => command.toJSON());

async function registerCommands() {
  if (!process.env.DISCORD_CLIENT_ID || !process.env.DISCORD_GUILD_ID) {
    console.warn("Slash commands were not registered: missing Discord application IDs.");
    return;
  }
  await new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN).put(
    Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID),
    { body: commands }
  );
  console.log("BSSU slash commands registered.");
}

function replyEphemeral(interaction, content) {
  return interaction.reply({ content, flags: MessageFlags.Ephemeral });
}

async function announcePollResult(channel, messageId) {
  try {
    const message = await channel.messages.fetch(messageId);
    const poll = message.poll;
    if (!poll) return;

    const answers = [...poll.answers.values()];
    const highestVoteCount = Math.max(...answers.map(answer => answer.voteCount));
    const winners = answers
      .filter(answer => answer.voteCount === highestVoteCount)
      .map(answer => answer.text)
      .join(" **ou** ");
    const resultsChannel = await channelFor(process.env.BSSU_RESULTS_CHANNEL_ID, channel);
    const result = highestVoteCount > 0
      ? `🏆 Horário vencedor: **${winners}** com **${highestVoteCount}** voto(s).`
      : "⚠️ A enquete terminou sem votos.";

    await resultsChannel.send({
      content: `${mentions()}\n📊 **Resultado da enquete BSSU**\n${result}`,
      allowedMentions: { roles: openers.roles, users: openers.users },
    });
  } catch (error) {
    console.error("BSSU poll result announcement failed:", error);
  }
}

client.once("clientReady", async () => {
  console.log(`BSSU bot online: ${client.user.tag}`);
  try { await registerCommands(); } catch (error) { console.error("Command registration failed:", error); }
});
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (!["marcar-bssu", "pedir-bssu", "abrir-bssu"].includes(interaction.commandName)) return replyEphemeral(interaction, "❌ Esse comando não existe mais.");
  if (!openers.roles.length && !openers.users.length) return replyEphemeral(interaction, "❌ Configure os responsáveis de BSSU no Render primeiro.");
  try {
    if (interaction.commandName === "marcar-bssu") {
      if (!canOpen(interaction)) return replyEphemeral(interaction, "❌ Você não pode marcar BSSU.");
      const channel = await channelFor(process.env.BSSU_POLL_CHANNEL_ID, interaction.channel);
      const horarios = ["horario_1", "horario_2", "horario_3", "horario_4", "horario_5"]
        .map(option => interaction.options.getString(option))
        .filter(Boolean);
      const message = await channel.send({ poll: {
        question: { text: "📅 Qual horário você prefere para a BSSU?" },
        answers: horarios.map(text => ({ text })),
        duration: pollHours,
        allowMultiselect: false,
      }});
      setTimeout(() => announcePollResult(channel, message.id), pollHours * 60 * 60 * 1000);
      return replyEphemeral(interaction, `✅ Enquete enviada em ${channel}.`);
    }
    if (interaction.commandName === "pedir-bssu") {
      if (!builders.length) return replyEphemeral(interaction, "❌ Configure o cargo Builder no Render primeiro.");
      if (!hasRole(interaction, builders)) return replyEphemeral(interaction, "❌ Apenas Builders podem pedir uma BSSU.");
      const channel = await channelFor(process.env.BSSU_REQUEST_CHANNEL_ID, interaction.channel);
      const motivo = interaction.options.getString("motivo") || "Nenhum detalhe informado.";
      await channel.send({ content: `${mentions()}\n📨 **Pedido de BSSU** por ${interaction.user}\n${motivo}`, allowedMentions: { roles: openers.roles, users: openers.users } });
      return replyEphemeral(interaction, `✅ Pedido enviado em ${channel}.`);
    }
    if (interaction.commandName === "abrir-bssu") {
      if (!canOpen(interaction)) return replyEphemeral(interaction, "❌ Você não pode abrir BSSU.");
      const channel = await channelFor(process.env.BSSU_ANNOUNCEMENT_CHANNEL_ID, interaction.channel);
      const nome = interaction.options.getString("nome") || "「:tools:」-{ Área-14 | :flag_br:  }-「:tools:」";
      const senha = interaction.options.getString("senha") || ".....";
      await channel.send({ content: `${nome}\n\nSenha: ${senha}\n\n@everyone`, allowedMentions: { parse: ["everyone"] } });
      return replyEphemeral(interaction, `✅ Anúncio enviado em ${channel}.`);
    }
    return replyEphemeral(interaction, "❌ Comando desconhecido.");
  } catch (error) {
    console.error("BSSU command failed:", error);
    return replyEphemeral(interaction, "❌ Não consegui concluir o comando. Confira canais e permissões.");
  }
});
if (!process.env.DISCORD_TOKEN) throw new Error("Missing DISCORD_TOKEN environment variable.");
client.login(process.env.DISCORD_TOKEN);

app.get("/", (_, response) => response.send("BSSU bot online"));
app.listen(process.env.PORT || 3000, () => console.log("Health server online"));
