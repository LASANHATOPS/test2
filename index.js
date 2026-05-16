const express = require("express");
const { Client, GatewayIntentBits } = require("discord.js");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const ALLOWED_CHANNEL_ID = process.env.ALLOWED_CHANNEL_ID;

let lastCommand = {
  id: 0,
  command: "none",
  door: "",
  author: "",
};

process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

if (!DISCORD_TOKEN) {
  console.error("ERRO: DISCORD_TOKEN nao configurado no Render.");
}

if (!ALLOWED_CHANNEL_ID) {
  console.error("ERRO: ALLOWED_CHANNEL_ID nao configurado no Render.");
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.on("ready", () => {
  console.log(`Bridge online como ${client.user.tag}`);
});

client.on("messageCreate", (msg) => {
  if (msg.author.bot) return;
  if (msg.channel.id !== ALLOWED_CHANNEL_ID) return;

  const args = msg.content.trim().split(/\s+/);
  const cmd = args[0].toLowerCase();
  const door = args[1] || "";

  const valid = ["!lockdown", "!unlockdown", "!open", "!close"];

  if (!valid.includes(cmd)) return;

  lastCommand = {
    id: Date.now(),
    command: cmd.replace("!", ""),
    door: door,
    author: msg.author.tag,
  };

  msg.reply(`✅ Comando enviado: \`${cmd} ${door}\``);
});

app.get("/", (req, res) => {
  res.send("Area-14 Bridge Online");
});

app.get("/command", (req, res) => {
  res.json(lastCommand);
});

app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
});

client.login(DISCORD_TOKEN);

app.get("/plain", (req, res) => {
  res.type("text/plain");
  res.send(`${lastCommand.id}|${lastCommand.command}|${lastCommand.door}|${lastCommand.author}`);
});

let lastAlert = {
  id: 0,
  team: "",
  mode: "",
  author: "",
  message: "",
};

client.on("messageCreate", (msg) => {
  if (msg.author.bot) return;
  if (msg.channel.id !== ALLOWED_CHANNEL_ID) return;

  const args = msg.content.trim().split(/\s+/);
  const cmd = args[0].toLowerCase();

  if (cmd === "!teamalert" || cmd === "!teampm") {
    const team = args[1] || "";
    const message = args.slice(2).join(" ");

    if (team === "" || message === "") {
      msg.reply("❌ Use: `!teamalert TIME mensagem` ou `!teampm TIME mensagem`");
      return;
    }

    lastAlert = {
      id: Date.now(),
      team: team,
      mode: cmd === "!teamalert" ? "alert" : "pm",
      author: msg.author.tag,
      message: message,
    };

    msg.reply(`✅ Mensagem enviada para sincronização: \`${team}\``);
  }
});

app.get("/alertplain", (req, res) => {
  res.type("text/plain");
  res.send(`${lastAlert.id}|${lastAlert.mode}|${lastAlert.team}|${lastAlert.author}|${lastAlert.message}`);
});
