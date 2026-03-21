import { PermissionFlagsBits, EmbedBuilder } from "discord.js";
import getConfig from "../../utils/getConfig.js";
import { modmailCache } from "../../events/messageCreate/modmailSessions.js";

export default {
  name: "closemail",
  description: "Close the current modmail thread.",
  permissionRequired: PermissionFlagsBits.ManageThreads,
  aliases: ["close", "endmail"],

  async callback(client, message) {
    try {
      const config = await getConfig();

      if (
        !message.channel.isThread() ||
        message.channel.parentId !== config.modmailForumChannelId
      ) {
        return message.reply(
          "This command can only be used inside a modmail thread.",
        );
      }

      const thread = message.channel;

      const match = thread.name.match(/\((\d+)\)$/);
      const userId = match ? match[1] : null;

      if (userId) modmailCache.delete(userId);

      if (userId) {
        const user = await client.users.fetch(userId).catch(() => null);
        if (user) {
          await user
            .send({
              embeds: [
                new EmbedBuilder()
                  .setTitle("Modmail Closed")
                  .setDescription(
                    "Your modmail thread has been closed. Feel free to open another one if you need help.",
                  )
                  .setColor(0x5865f2),
              ],
            })
            .catch(() => null);
        }
      }

      await thread.send("🔒 Modmail closed. This thread will now be deleted.");

      await thread.delete().catch(() => null);
    } catch (err) {
      console.error("Closemail error:", err);
      if (message.channel) {
        message.channel
          .send("Failed to close modmail thread.")
          .catch(() => null);
      }
    }
  },
};
