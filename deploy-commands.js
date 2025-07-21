// deploy-commands.js
import dotenv from 'dotenv';
import { REST, Routes } from 'discord.js';
import { data as umaData } from './commands.js';

dotenv.config();

const commands = [ umaData.toJSON() ];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Registering slash commands…');
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );
    console.log('Slash commands registered!');
  } catch (err) {
    console.error(err);
  }
})();
