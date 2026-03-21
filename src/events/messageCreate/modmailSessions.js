import {
  ChannelType,
  EmbedBuilder,
  ButtonStyle,
  ButtonBuilder,
  ActionRowBuilder,
} from "discord.js";
import getConfig from "../../utils/getConfig.js";

export const modmailCache = new Map();

export default async (client, message) => {
  if (message.author.bot) return;
  if (message.channel.type !== ChannelType.DM) return;

  try {
    const config = await getConfig();
    const forum = await client.channels
      .fetch(config.modmailForumChannelId)
      .catch(() => null);
    if (!forum) return;

    let thread = null;
    const cachedId = modmailCache.get(message.author.id);
    if (cachedId) {
      thread = await client.channels.fetch(cachedId).catch(() => null);
      if (!thread || thread.archived || thread.locked) {
        modmailCache.delete(message.author.id);
        thread = null;
      }
    }

    if (!thread) {
      const preview = new EmbedBuilder()
        .setTitle("📩 Modmail Preview")
        .setColor(0x5865f2)
        .setAuthor({
          name: message.author.tag,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      if (message.content) {
        preview.addFields({ name: "Message", value: message.content });
      }
      if (message.attachments.size > 0) {
        const first = message.attachments.first();
        if (first.contentType?.startsWith("image/")) {
          preview.setImage(first.url);
        } else {
          preview.addFields({
            name: "Attachment",
            value: first.url,
          });
        }
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("modmail_confirm")
          .setLabel("✅ Continue")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId("modmail_cancel")
          .setLabel("❌ Cancel")
          .setStyle(ButtonStyle.Secondary),
      );

      const reply = await message.reply({
        embeds: [preview],
        components: [row],
      });

      const filter = (i) =>
        i.user.id === message.author.id &&
        ["modmail_confirm", "modmail_cancel"].includes(i.customId);

      const collector = reply.createMessageComponentCollector({
        filter,
        time: 30000,
      });

      collector.on("collect", async (i) => {
        if (i.customId === "modmail_cancel") {
          return i.update({
            content: "Cancelled.",
            embeds: [],
            components: [],
          });
        }

        const starter = new EmbedBuilder()
          .setAuthor({
            name: message.author.tag,
            iconURL: message.author.displayAvatarURL(),
          })
          .setColor(0x2b2d31)
          .setTimestamp();

        if (message.content) starter.setDescription(message.content);
        if (message.attachments.size > 0) {
          const first = message.attachments.first();
          if (first.contentType?.startsWith("image/")) {
            starter.setImage(first.url);
          } else {
            starter.addFields({ name: "Attachment", value: first.url });
          }
        }

        thread = await forum.threads.create({
          name: `${message.author.username} (${message.author.id})`,
          message: {
            content: `<@&${config.moderatorRole}> New modmail opened!`,
            embeds: [starter],
          },
        });

        modmailCache.set(message.author.id, thread.id);

        await i.update({
          embeds: [
            new EmbedBuilder()
              .setTitle("✅ Modmail Sent")
              .setDescription(
                "Your message has been forwarded to the moderators.",
              )
              .setColor(0x5865f2)
              .setTimestamp(),
          ],
          content: "",
          components: [],
        });
      });

      collector.on("end", async (c) => {
        if (c.size === 0) {
          await reply.edit({
            content: "Timed out.",
            embeds: [],
            components: [],
          });
        }
      });

      return;
    }

    const embed = new EmbedBuilder()
      .setAuthor({
        name: message.author.tag,
        iconURL: message.author.displayAvatarURL(),
      })
      .setColor(0x2b2d31)
      .setTimestamp();

    if (message.content) embed.setDescription(message.content);
    if (message.attachments.size > 0) {
      const first = message.attachments.first();
      if (first.contentType?.startsWith("image/")) {
        embed.setImage(first.url);
      } else {
        embed.addFields({ name: "Attachment", value: first.url });
      }
    }

    const sent = await thread.send({ embeds: [embed] });
    await message.react("✅");
  } catch (err) {
    console.error("Failed to forward user message:", err);
    await message.react("❌").catch(() => null);
  }
};
