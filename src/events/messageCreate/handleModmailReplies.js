import getConfig from "../../utils/getConfig.js";
import { prefixes } from "./handleCommands.js";

export default async (client, message) => {
  if (message.author.bot) return;
  if (message.webhookId) return;
  if (prefixes.some((p) => message.content.startsWith(p))) return;

  try {
    const config = await getConfig();

    if (!message.channel.isThread()) return;
    if (message.channel.parentId !== config.modmailChannelId) return;

    const parentMessage = await message.channel.fetchStarterMessage();
    const embed = parentMessage.embeds[0];
    const userId = embed.footer.text.split("uid: ")[1];

    const user = await client.users.fetch(userId).catch(() => null);
    if (!user) return;

    const parent = await client.channels.fetch(config.modmailChannelId);

    const webhooks = await parent.fetchWebhooks();

    const webhook =
      webhooks.find(
        (w) => w.owner?.id === client.user.id && w.name === "modmail",
      ) || (await parent.createWebhook({ name: "modmail" }));

    const attachments = [...message.attachments.values()];

    const dmPayload = {};
    if (message.content?.trim()) dmPayload.content = message.content;
    if (attachments.length) dmPayload.files = attachments.map((a) => a.url);

    await user.send(dmPayload);

    await message.react("✅");
  } catch (err) {
    console.error("Modmail reply error:", err);
    await message.react("❌").catch(() => null);
  }
};
