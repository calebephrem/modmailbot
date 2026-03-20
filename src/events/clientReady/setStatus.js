import { ActivityType } from "discord.js";

export default (client) => {
  client.user.setPresence({
    activities: [
      {
        name: "DM to contact staff",
        type: ActivityType.Playing,
      },
    ],
    status: "playing",
  });
};
