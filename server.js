const express = require("express");
const { Client, GatewayIntentBits } = require("discord.js");
const { Octokit } = require("@octokit/rest");

const app = express();

const OWNER = "LASANHATOPS";
const REPO = "test2";
const PATH = "whitelist.json";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

async function getWhitelistFile() {
  const res = await octokit.repos.getContent({
    owner: OWNER,
    repo: REPO,
    path: PATH,
  });

  const content = Buffer.from(res.data.content, "base64").toString("utf8");
  return {
    data: JSON.parse(content),
    sha: res.data.sha,
  };
}

async function saveWhitelistFile(data, sha, message) {
  await octokit.repos.createOrUpdateFileContents({
    owner: OWNER,
    repo: REPO,
    path: PATH,
    message,
    content: Buffer.from(JSON.stringify(data, null, 2)).toString("base64"),
    sha,
  });
}

function normalizeDepartment(input) {
  const value = input.toLowerCase();

  const aliases = {
    ad: "Administrative Department",
    administrative: "Administrative Department",
    admin: "Administrative Department",

    sec: "Security Department",
    security: "Security Department",

    sci: "Scientific Department",
    scientific: "Scientific Department",

    med: "Medical Department",
    medical: "Medical Department",

    mtf: "Mobile Task Force",
    "mobile task force": "Mobile Task Force",
  };

  return aliases[value] || input;
}

app.get("/", (req, res) => {
  res.send("A14 API online");
});

app.get("/whitelist", async (req, res) => {
  try {
    const { data } = await getWhitelistFile();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load whitelist" });
  }
});

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.on("ready", () => {
  console.log(`Discord bot online: ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  await interaction.deferReply({ ephemeral: true });

  try {
    const { data, sha } = await getWhitelistFile();
    const cmd = interaction.commandName;

    if (cmd === "wl_add" || cmd === "wl_remove") {
      const user = interaction.options.getString("user");
      const departmentInput = interaction.options.getString("department");
      const department = normalizeDepartment(departmentInput);

      if (!data.departments[department]) {
        data.departments[department] = [];
      }

      if (cmd === "wl_add") {
        if (!data.departments[department].includes(user)) {
          data.departments[department].push(user);
        }

        await saveWhitelistFile(data, sha, `Add ${user} to ${department}`);
        return interaction.editReply(`✅ ${user} adicionado em **${department}**.`);
      }

      if (cmd === "wl_remove") {
        data.departments[department] = data.departments[department].filter(x => x !== user);

        await saveWhitelistFile(data, sha, `Remove ${user} from ${department}`);
        return interaction.editReply(`✅ ${user} removido de **${department}**.`);
      }
    }

    if (cmd === "morph_add" || cmd === "morph_remove") {
      const user = interaction.options.getString("user");

      if (!data.customMorphWhitelist) {
        data.customMorphWhitelist = [];
      }

      if (cmd === "morph_add") {
        if (!data.customMorphWhitelist.includes(user)) {
          data.customMorphWhitelist.push(user);
        }

        await saveWhitelistFile(data, sha, `Add ${user} to custom morph whitelist`);
        return interaction.editReply(`✅ ${user} agora pode usar morph custom.`);
      }

      if (cmd === "morph_remove") {
        data.customMorphWhitelist = data.customMorphWhitelist.filter(x => x !== user);

        await saveWhitelistFile(data, sha, `Remove ${user} from custom morph whitelist`);
        return interaction.editReply(`✅ ${user} removido da morph custom.`);
      }
    }

    return interaction.editReply("Comando desconhecido.");
  } catch (err) {
    console.error(err);
    return interaction.editReply("❌ Erro ao atualizar whitelist.");
  }
});

client.login(process.env.DISCORD_TOKEN);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("A14 API running"));
