import {
  ChannelType,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} from "discord.js";
import getConfig from "../../utils/getConfig.js";
import crypto from "crypto";

export const modmailCache = new Map();

export default async (client, message) => {
  if (message.author.bot) return;
  if (message.channel.type !== ChannelType.DM) return;

  try {
    const config = await getConfig();

    const parent = await client.channels
      .fetch(config.modmailChannelId)
      .catch(() => null);

    if (!parent) return;

    let thread = modmailCache.get(message.author.id) || null;

    if (thread) {
      thread = await client.channels.fetch(thread).catch(() => null);
      if (!thread || thread.archived || thread.locked) {
        modmailCache.delete(message.author.id);
        thread = null;
      }
    }

    const preview = new EmbedBuilder()
      .setTitle("Modmail Preview")
      .setColor(0x5865f2)
      .setAuthor({
        name: message.author.tag,
        iconURL: message.author.displayAvatarURL(),
      })
      .setTimestamp();

    if (message.content) preview.setDescription(message.content);

    if (message.attachments.size > 0) {
      const file = message.attachments.first();
      if (file.contentType?.startsWith("image/")) preview.setImage(file.url);
      else preview.addFields({ name: "Attachment", value: file.url });
    }

    if (!thread) {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("modmail_confirm")
          .setLabel("Continue")
          .setEmoji("✅")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId("modmail_cancel")
          .setLabel("Cancel")
          .setEmoji("❌")
          .setStyle(ButtonStyle.Secondary),
      );

      const prompt = await message.reply({
        embeds: [preview],
        components: [row],
      });

      const collector = prompt.createMessageComponentCollector({
        time: 30000,
        max: 1,
      });

      collector.on("collect", async (i) => {
        if (i.user.id !== message.author.id) return;

        await i.deferUpdate();

        if (i.customId === "modmail_cancel") {
          return prompt.edit({
            content: "Cancelled",
            embeds: [],
            components: [],
          });
        }

        const id = crypto.randomBytes(4).toString("hex");

        const threadEmbed = new EmbedBuilder()
          .setTitle("New Modmail")
          .setColor(0x5865f2)
          .setThumbnail(message.author.displayAvatarURL())
          .addFields(
            { name: "User", value: `<@${message.author.id}>`, inline: true },
            { name: "User Tag", value: message.author.tag, inline: true },
            { name: "Modmail ID", value: id, inline: true },
            {
              name: "Timestamp",
              value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
              inline: true,
            },
          )
          .setFooter({ text: `uid: ${message.author.id}` })
          .setTimestamp();

        const threadMsg = await parent.send({
          content: `<@&${config.moderatorRole}> new modmail by <@${message.author.id}>\n-# #${id}`,
          embeds: [threadEmbed],
        });

        const thread = await threadMsg.startThread({
          name: `${message.author.tag} (${id})`,
          autoArchiveDuration: 1440,
        });

        modmailCache.set(message.author.id, thread.id);

        await sendToThread(client, parent, thread, message);

        await prompt.edit({
          content: "",
          embeds: [
            new EmbedBuilder()
              .setTitle("✅ Modmail thread created")
              .addFields(
                {
                  name: "Modmail ID",
                  value: id,
                  inline: true,
                },
                {
                  name: "Timestamp",
                  value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
                  inline: true,
                },
              )
              .setThumbnail(message.author.displayAvatarURL())
              .setColor(0x5865f2),
          ],
          components: [],
        });
      });

      collector.on("end", async (collected) => {
        if (!collected.size) {
          await prompt.edit({
            content: "Timed out",
            embeds: [],
            components: [],
          });
        }
      });

      return;
    }

    await sendToThread(client, parent, thread, message);
  } catch (err) {
    console.error(err);
  }
};

async function sendToThread(client, parent, thread, message) {
  const webhooks = await parent.fetchWebhooks();

  const webhook =
    webhooks.find(
      (w) => w.owner?.id === client.user.id && w.name === "modmail",
    ) || (await parent.createWebhook({ name: "modmail" }));

  const payload = {
    username: message.author.username,
    avatarURL: message.author.displayAvatarURL(),
    content: message.content || null,
    threadId: thread.id,
  };

  const attachments = [...message.attachments.values()];
  if (attachments.length) {
    payload.files = attachments.map((a) => a.url);
  }

  await webhook.send(payload);

  await message.react("✅");
}
