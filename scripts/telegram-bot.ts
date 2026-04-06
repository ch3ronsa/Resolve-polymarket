import { Bot } from "grammy";

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error("TELEGRAM_BOT_TOKEN is required to run the Telegram bot shell.");
  process.exit(1);
}

const bot = new Bot(token);

bot.command("start", async (context) => {
  await context.reply(
    "ResolveRadar bot shell is live. Paste a Polymarket URL or slug and the analysis route can be wired in next."
  );
});

bot.on("message:text", async (context) => {
  await context.reply(
    "Telegram delivery is scaffolded for the MVP, but the message-to-analysis flow is intentionally left for the next task."
  );
});

bot.start();

