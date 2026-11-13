const { REST, Routes, SlashCommandBuilder } = require("discord.js");
const commands = [
  ["marcar-bssu", "Cria uma enquete para marcar uma BSSU", "horario", "Data e horário planejados"],
  ["pedir-bssu", "Solicita a abertura de uma BSSU", "motivo", "Explique o que será construído"],
  ["abrir-bssu", "Anuncia que uma BSSU foi aberta", "detalhes", "Link, código ou instruções"],
].map(([name, description, optionName, optionDescription]) => new SlashCommandBuilder().setName(name).setDescription(description).addStringOption(option => option.setName(optionName).setDescription(optionDescription).setRequired(false)).toJSON());
for (const name of ["DISCORD_TOKEN", "DISCORD_CLIENT_ID", "DISCORD_GUILD_ID"]) if (!process.env[name]) throw new Error(`Missing ${name} environment variable.`);
new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN).put(Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID), { body: commands }).then(() => console.log("BSSU slash commands registered."));
