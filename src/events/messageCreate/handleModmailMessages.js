import { EmbedBuilder } from "discord.js";
import getConfig from "../../utils/getConfig.js";
import { prefixes } from "./handleCommands.js";

export default async (client, message) => {
  if (message.author.bot) return;
  if (prefixes.some((p) => message.content.startsWith(p))) return;

  const config = await getConfig();

  if (
    !message.channel.isThread() ||
    message.channel.parentId !== config.modmailForumChannelId
  )
    return;

  const thread = message.channel;
  const match = thread.name.match(/\((\d+)\)$/);
  const userId = match ? match[1] : null;
  if (!userId) return;

  const user = await client.users.fetch(userId).catch(() => null);
  if (!user) return;

  const embed = new EmbedBuilder()
    .setAuthor({ name: `Staff ⚔️ ${message.guild?.name || "Server"}` })
    .setColor(0x5865f2)
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

  await user.send({ embeds: [embed] }).catch(() => null);
};
