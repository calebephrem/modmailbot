import { ActivityType } from "discord.js";

export default (client) => {
  const opts = {
    activities: [
      {
        name: "DM to contact staff",
        type: ActivityType.Playing,
      },
    ],
    status: "playing",
  };
  client.user.setPresence(opts);
  setInterval(
    () => {
      client.user.setPresence(opts);
    },
    60 * 60 * 1000,
  );
};
