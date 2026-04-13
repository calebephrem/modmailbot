import { EmbedBuilder } from "discord.js";
import getConfig from "../../utils/getConfig.js";
import { modmailCache } from "./modmailSessions.js";
import { prefixes } from "./handleCommands.js";

export default async (client, message) => {
  if (message.author.bot) return;
  if (prefixes.some((p) => message.content.startsWith(p))) return;

  try {
    const config = await getConfig();

    if (!message.channel.isThread()) return;
    if (message.channel.parentId !== config.modmailChannelId) return;

    const match = message.channel.name.match(/\|\s(\d+)$/);
    if (!match) return;

    const userId = match[1];
    const user = await client.users.fetch(userId).catch(() => null);
    if (!user) return;

    const embed = new EmbedBuilder()
      .setAuthor({
        name: `Staff`,
        iconURL: message.guild.iconURL(),
      })
      .setColor(0x5865f2)
      .setTimestamp();

    if (message.content) embed.setDescription(message.content);

    if (message.attachments.size > 0) {
      const file = message.attachments.first();
      if (file.contentType?.startsWith("image/")) embed.setImage(file.url);
      else embed.addFields({ name: "Attachment", value: file.url });
    }

    await user.send({ embeds: [embed] });
    await message.react("✅");
  } catch {
    await message.react("❌").catch(() => null);
  }
};
