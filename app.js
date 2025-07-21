// app.js

import express from 'express';
const server = express();
server.all('/', (_, res) => res.send('OK'));
server.listen(3000);

import dotenv from 'dotenv';
import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { data as cmdData, execute as cmdExec } from './commands.js';

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();
client.commands.set(cmdData.name, { data: cmdData, execute: cmdExec });

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const cmd = client.commands.get(interaction.commandName);
  if (!cmd) return;
  try {
    await cmd.execute(interaction);
  } catch (err) {
    console.error(err);
    await interaction.reply({ content: 'Something went wrong!', ephemeral: true });
  }
});

client.login(process.env.DISCORD_TOKEN);
