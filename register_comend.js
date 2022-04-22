const { SlashCommandBuilder } = require("@discordjs/builders");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { clientId, guildId, token } = require("./token.json");
const client = new Discord.Client();

const commands = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with pong!"),
  // new SlashCommandBuilder().setName('server').setDescription('Replies with server info!'),
  // new SlashCommandBuilder().setName('user').setDescription('Replies with user info!'),
].map((command) => command.toJSON());

const rest = new REST({ version: "9" }).setToken(token);

rest
  .put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
  .then(() => console.log("Successfully registered application commands."))
  .catch(console.error);

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === "ping1") {
    await interaction.reply({ content: "Pong!", ephemeral: true });
  }

  if (interaction.commandName === "ping") {
    const exampleEmbed = {
      color: 0x0099ff,
      title: "Some title",
      url: "https://discord.js.org",
      author: {
        name: "Some name",
        icon_url: "https://i.imgur.com/AfFp7pu.png",
        url: "https://discord.js.org",
      },
      description: "Some description here",
      thumbnail: {
        url: "https://i.imgur.com/AfFp7pu.png",
      },
      fields: [
        {
          name: "Regular field title",
          value: "Some value here",
        },
        {
          name: "\u200b",
          value: "\u200b",
          inline: false,
        },
        {
          name: "Inline field title",
          value: "Some value here",
          inline: true,
        },
        {
          name: "Inline field title",
          value: "Some value here",
          inline: true,
        },
        {
          name: "Inline field title",
          value: "Some value here",
          inline: true,
        },
      ],
      image: {
        url: "https://i.imgur.com/AfFp7pu.png",
      },
      timestamp: new Date(),
      footer: {
        text: "Some footer text here",
        icon_url: "https://i.imgur.com/AfFp7pu.png",
      },
    };
    const row = new Discord.MessageActionRow().addComponents(
      new Discord.MessageButton()
        .setCustomId("primary")
        .setLabel("Primary")
        .setStyle("PRIMARY")
    );
    await interaction.reply({
      content: "Pong!",
      ephemeral: true,
      embeds: [exampleEmbed],
      components: [row],
    });

    // await interaction.reply({ content: 'Pong!', ephemeral: true, embeds: [embed], components: [row] });
  }
});
