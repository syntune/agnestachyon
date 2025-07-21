// commands.js
import axios from 'axios';
import { SlashCommandBuilder } from 'discord.js';

// 1) Format the user input into the proper Uma Musume tag
function formatUmaTag(name) {
  const base = name.trim().toLowerCase().replace(/\s+/g, '_');
  return `${base}_(umamusume)`;
}

// 2) Check if a Danbooru tag exists
async function tagExists(tag) {
  // Danbooru tags endpoint; limit=1 to minimize payload
  const res = await axios.get('https://danbooru.donmai.us/tags.json', {
    params: {
      'search[name]': tag,
      limit: 1
    }
  });
  // res.data is an array of Tag objects; check if the first one matches our tag
  return res.data.length > 0 && res.data[0].name === tag;
}

export const data = new SlashCommandBuilder()
  .setName('uma')
  .setDescription('You want me to find an Uma Musume girl for you?')
  .addStringOption(opt =>
    opt
      .setName('name')
      .setDescription('Name of the Uma')
      .setRequired(true)
  );

export async function execute(interaction) {
  const userInput = interaction.options.getString('name');
  await interaction.deferReply();

  // Format and verify the tag
  const umaTag = formatUmaTag(userInput);
  let exists;
  try {
    exists = await tagExists(umaTag);
  } catch (err) {
    console.error('Tag check failed:', err);
    return interaction.editReply('❌ This tag... trainer, does not exist.');
  }
  if (!exists) {
    return interaction.editReply(
      `❌ I couldn’t find any Uma called **${userInput}** (tried \`${umaTag}\`).`
    );
  }

  // Now fetch images, retrying if Danbooru complains about >2 tags
  const ratingTag = 'rating:safe';
  const tryFetch = async tagsArr => {
    const resp = await axios.get('https://danbooru.donmai.us/posts.json', {
      params: { tags: tagsArr.join(' '), limit: 50, random: 'true' },
    });
    return resp.data;
  };

  let posts;
  try {
    // First attempt: tag + rating
    posts = await tryFetch([umaTag, ratingTag]);
  } catch (err) {
    // Danbooru sometimes errors if you exceed their tag limit—fallback to just the character tag
    if (
      err.response?.status === 422 &&
      err.response.data.error === 'PostQuery::TagLimitError'
    ) {
      posts = await tryFetch([umaTag]);
    } else {
      console.error('Image fetch error:', err);
      return interaction.editReply('❌ I suppose my calculations were off by a slight margin... I did not find it.');
    }
  }

  if (!posts.length) {
    return interaction.editReply(
      `❌ My...genius failed to find anything for **${userInput}**.`
    );
  }

  // Pick the first (already randomized) and send it
  const post = posts[0];
  const fileUrl = post.file_url || post.large_file_url;
  if (!fileUrl) {
    return interaction.editReply('❌ Trainer... the post I found does not have an URL.');
  }

  await interaction.editReply({
    embeds: [{
      title: `${userInput} — Is this what you were looking for, guinea pig?`,
      image: { url: fileUrl },
      footer: { text: `Danbooru post #${post.id}` }
    }]
  });
}
