# 📩 Discord Modmail Bot

A lightweight **modmail system** for DevHub built with discord.js v14.
Users can DM the bot to open a private support thread in a designated forum channel.
Staff can reply inside the thread, and messages (including images/attachments) are relayed back and forth.

## ✨ Features

- Confirmation step: When a user first DMs the bot, they see a preview embed with ✅ Continue / ❌ Cancel buttons before a thread is created.
- Thread caching: Each user is mapped to their active modmail thread. Cache is cleared when threads are closed.
- Attachments support: Images are embedded directly (`setImage`), other files are linked neatly inside the embed.
- Two‑way communication:
  - User → Staff: DMs are forwarded into the forum thread.
  - Staff → User: Replies inside the thread are forwarded back to the user.
- Closing threads: Staff can run `!closemail` (or aliases `!close`, `!endmail`) inside a modmail thread to archive + lock it, notify the user, and clear the cache.

## 🚀 Usage

1. User DMs the bot
   - Bot shows a confirmation embed previewing their message/attachments.
   - On ✅ Continue, a new forum thread is created with their message as the starter post.

2. Conversation flow
   - User sends messages or images → forwarded into the thread.
   - Staff replies inside the thread → forwarded back to the user.
   - Images are embedded directly; other attachments are linked inside the embed.

3. Closing a thread
   - Staff runs `!closemail` inside the thread.
   - Bot archives + locks the thread, notifies the user, and clears the cache.

## 📌 Notes

- Threads are named `username (userId)` for easy identification.
- Cache ensures each user only has one active thread at a time.
- If a user DMs again after closing, a fresh thread is created.

## 🖼️ Attachments Handling

- Images → displayed inside the embed (`setImage`).
- Other files → added as a field with a clickable link.
- No duplicate sending (no raw file + embed link at the same time).

## ✅ Requirements

- Node.js 18+
- discord.js v14

Install dependencies:

```sh
npm install discord.js dotenv
```

## 📜 License

SEE LICENSE IN [LICENSE](./LICENSE)
