const { REST, Routes, SlashCommandBuilder } = require("discord.js");
const commands = [
  new SlashCommandBuilder().setName("marcar-bssu").setDescription("Cria uma enquete com horários para a BSSU")
    .addStringOption(option => option.setName("horario_1").setDescription("Primeira opção de horário").setRequired(true))
    .addStringOption(option => option.setName("horario_2").setDescription("Segunda opção de horário"))
    .addStringOption(option => option.setName("horario_3").setDescription("Terceira opção de horário"))
    .addStringOption(option => option.setName("horario_4").setDescription("Quarta opção de horário"))
    .addStringOption(option => option.setName("horario_5").setDescription("Quinta opção de horário")),
  new SlashCommandBuilder().setName("pedir-bssu").setDescription("Solicita a abertura de uma BSSU")
    .addStringOption(option => option.setName("motivo").setDescription("Explique o que será construído")),
  new SlashCommandBuilder().setName("abrir-bssu").setDescription("Anuncia que uma BSSU foi aberta")
    .addStringOption(option => option.setName("nome").setDescription("Nome do servidor"))
    .addStringOption(option => option.setName("senha").setDescription("Senha do servidor")),
].map(command => command.toJSON());
for (const name of ["DISCORD_TOKEN", "DISCORD_CLIENT_ID", "DISCORD_GUILD_ID"]) if (!process.env[name]) throw new Error(`Missing ${name} environment variable.`);
new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN).put(Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID), { body: commands }).then(() => console.log("BSSU slash commands registered."));
