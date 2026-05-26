const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [
  new SlashCommandBuilder()
    .setName("wl_add")
    .setDescription("Adiciona player na whitelist de um departamento")
    .addStringOption(o => o.setName("user").setDescription("Nome Roblox").setRequired(true))
    .addStringOption(o => o.setName("department").setDescription("Departamento").setRequired(true)),

  new SlashCommandBuilder()
    .setName("wl_remove")
    .setDescription("Remove player da whitelist de um departamento")
    .addStringOption(o => o.setName("user").setDescription("Nome Roblox").setRequired(true))
    .addStringOption(o => o.setName("department").setDescription("Departamento").setRequired(true)),

  new SlashCommandBuilder()
    .setName("morph_add")
    .setDescription("Libera morph custom para um player")
    .addStringOption(o => o.setName("user").setDescription("Nome Roblox").setRequired(true)),

  new SlashCommandBuilder()
    .setName("morph_remove")
    .setDescription("Remove morph custom de um player")
    .addStringOption(o => o.setName("user").setDescription("Nome Roblox").setRequired(true)),
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  await rest.put(
    Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID),
    { body: commands }
  );

  console.log("Slash commands registrados.");
})();
