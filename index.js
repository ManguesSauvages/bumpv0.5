tconst { Client, GatewayIntentBits, Partials, REST, Routes, SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  partials: [Partials.Channel],
});

const bumpConfigPath = './bump_config.json';
let bumpChannelId = null;

if (fs.existsSync(bumpConfigPath)) {
  const data = JSON.parse(fs.readFileSync(bumpConfigPath));
  bumpChannelId = data.channelId;
}

// Commande slash /setbumpchannel
client.once('ready', async () => {
  const commands = [
    new SlashCommandBuilder()
      .setName('setbumpchannel')
      .setDescription('Définit le salon de bump automatique')
      .addChannelOption(option =>
        option.setName('channel')
          .setDescription('Salon pour le bump')
          .setRequired(true)),
  ].map(command => command.toJSON());

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  const appId = (await rest.get(Routes.oauth2CurrentApplication())).id;

  await rest.put(
    Routes.applicationCommands(appId),
    { body: commands }
  );

  console.log(`? Bot prêt. Connecté en tant que ${client.user.tag}`);

  // Lancer le bump automatique
  bumpLoop();
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'setbumpchannel') {
    const channel = interaction.options.getChannel('channel');
    bumpChannelId = channel.id;
    fs.writeFileSync(bumpConfigPath, JSON.stringify({ channelId: bumpChannelId }));
    await interaction.reply(`? Salon de bump défini : ${channel.name}`);
  }
});

// Boucle de bump toutes les 2h
function bumpLoop() {
  setInterval(() => {
    if (bumpChannelId) {
      const channel = client.channels.cache.get(bumpChannelId);
      if (channel) {
        channel.send('!d bump');
        console.log(`[${new Date().toLocaleString()}] Bump effectué dans ${channel.name}`);
      }
    }
  }, 2 * 60 * 60 * 1000); // 2 heures
}

client.login(process.env.DISCORD_TOKEN);
