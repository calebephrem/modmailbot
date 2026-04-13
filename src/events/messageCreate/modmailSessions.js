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

    let thread = null;

    if (modmailCache.has(message.author.id)) {
      thread = await client.channels
        .fetch(modmailCache.get(message.author.id))
        .catch(() => null);

      if (!thread || thread.archived || thread.locked) {
        modmailCache.delete(message.author.id);
        thread = null;
      }
    }

    if (!thread) {
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
        if (file.contentType?.startsWith("image/")) {
          preview.setImage(file.url);
        } else {
          preview.addFields({ name: "Attachment", value: file.url });
        }
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("confirm")
          .setLabel("Continue")
          .setEmoji("✅")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId("cancel")
          .setLabel("Cancel")
          .setEmoji("❌")
          .setStyle(ButtonStyle.Secondary),
      );

      const msg = await message.reply({
        embeds: [preview],
        components: [row],
      });

      const collector = msg.createMessageComponentCollector({
        time: 30000,
        max: 1,
      });

      collector.on("collect", async (i) => {
        if (i.user.id !== message.author.id) return;

        await i.deferUpdate();

        if (i.customId === "cancel") {
          return msg.edit({
            content: "Cancelled",
            embeds: [],
            components: [],
          });
        }

        const id = crypto.randomBytes(4).toString("hex");

        const modmailEmbed = new EmbedBuilder()
          .setTitle("New Modmail")
          .setColor(0x5865f2)
          .setThumbnail(message.author.displayAvatarURL())
          .addFields(
            { name: "User", value: `<@${message.author.id}>`, inline: true },
            { name: "User Tag", value: message.author.tag, inline: true },
            { name: "Modmail ID", value: `${id}`, inline: true },
            {
              name: "Timestamp",
              value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
              inline: true,
            },
          )
          .setFooter({ text: `uid: ${message.author.id}` })
          .setTimestamp();

        if (message.attachments.size > 0) {
          const file = message.attachments.first();
          if (file.contentType?.startsWith("image/")) {
            modmailEmbed.setImage(file.url);
          } else {
            modmailEmbed.addFields({
              name: "Attachment",
              value: file.url,
            });
          }
        }

        const threadMsg = await parent.send({
          content: `new modmail by <@${message.author.id}>\n-# #${id}`,
          embeds: [modmailEmbed],
        });

        thread = await threadMsg.startThread({
          name: `${message.author.tag} | ${message.author.id}`,
        });

        modmailCache.set(message.author.id, thread.id);

        const firstEmbed = new EmbedBuilder()
          .setAuthor({
            name: message.author.tag,
            iconURL: message.author.displayAvatarURL(),
          })
          .setColor(0x2b2d31)
          .setTimestamp();

        if (message.content) firstEmbed.setDescription(message.content);

        if (message.attachments.size > 0) {
          const file = message.attachments.first();
          if (file.contentType?.startsWith("image/")) {
            firstEmbed.setImage(file.url);
          } else {
            firstEmbed.addFields({ name: "Attachment", value: file.url });
          }
        }

        await thread.send({ embeds: [firstEmbed] });

        await msg.edit({
          embeds: [
            new EmbedBuilder()
              .setTitle("✅ Modmail thread created")
              .setFields(
                { name: "Modmail ID", value: `${id}`, inline: true },
                {
                  name: "Timestamp",
                  value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
                  inline: true,
                },
              )
              .setColor(0x5865f2),
          ],
          components: [],
          content: "",
        });
      });

      collector.on("end", async (collected) => {
        if (collected.size === 0) {
          await msg.edit({
            content: "Timed out",
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
      const file = message.attachments.first();
      if (file.contentType?.startsWith("image/")) {
        embed.setImage(file.url);
      } else {
        embed.addFields({ name: "Attachment", value: file.url });
      }
    }

    await thread.send({ embeds: [embed] });
    await message.react("✅");
  } catch (err) {
    console.error(err);
    await message.react("❌").catch(() => null);
  }
};
