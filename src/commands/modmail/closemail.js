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
        message.channel.parentId !== config.modmailChannelId
      ) {
        return message.reply(
          "This command can only be used inside a modmail thread.",
        );
      }

      const thread = message.channel;

      const parentMessage = await thread.fetchStarterMessage();
      const embed = parentMessage.embeds[0];
      const userId = embed.footer.text.split("uid: ")[1];

      modmailCache.delete(userId);

      const user = await client.users.fetch(userId).catch(() => null);

      if (user) {
        await user
          .send({
            embeds: [
              new EmbedBuilder()
                .setTitle("Modmail Closed")
                .setDescription(
                  "Your modmail has been closed. You can open a new one anytime.",
                )
                .setColor(0xff4d4d),
            ],
          })
          .catch(() => null);
      }

      await thread.send({
        embeds: [
          new EmbedBuilder()
            .setDescription("🔒 Modmail closed")
            .setColor(0xff4d4d),
        ],
      });

      await thread.setLocked(true);
      await thread.setArchived(true);
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
