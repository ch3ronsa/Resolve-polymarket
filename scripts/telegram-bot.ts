import { env } from "@/lib/env";
import { createTelegramBot, syncTelegramCommands } from "@/lib/telegram/bot";
import { logTelegramError, logTelegramInfo } from "@/lib/telegram/logging";

async function main() {
  if (!env.TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN is required to run the Telegram bot.");
  }

  if (env.TELEGRAM_BOT_MODE !== "polling") {
    throw new Error(
      "scripts/telegram-bot.ts starts local polling only. Reuse createTelegramBot() for webhook deployment."
    );
  }

  const bot = createTelegramBot();
  await syncTelegramCommands(bot);

  process.once("SIGINT", () => bot.stop());
  process.once("SIGTERM", () => bot.stop());

  logTelegramInfo("startup", "Starting ResolveRadar Telegram bot in polling mode", {
    watchLimit: env.TELEGRAM_WATCH_LIMIT
  });

  await bot.start({
    allowed_updates: ["message"]
  });
}

main().catch((error) => {
  logTelegramError("startup", error);
  process.exit(1);
});
