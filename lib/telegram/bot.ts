import { Bot, type Context } from "grammy";

import { MarketAnalysisRequestError, runMarketAnalysis } from "@/lib/analysis/run-market-analysis";
import { env } from "@/lib/env";
import { isPolymarketApiError } from "@/lib/polymarket/errors";
import { extractPolymarketSlug } from "@/lib/polymarket/slug";
import { logTelegramError, logTelegramInfo, logTelegramWarn } from "@/lib/telegram/logging";
import {
  formatTelegramAnalysisReply,
  formatTelegramHelpReply,
  formatTelegramWatchReply
} from "@/lib/telegram/format";
import { mapWatchApiKind } from "@/lib/watch/generate-watchlist";
import { readGeneratedWatchEntries } from "@/lib/watch/store";

type CommandContext = Context & {
  match?: string;
};

function commandArgument(context: CommandContext) {
  if (typeof context.match === "string") {
    return context.match.trim();
  }

  return "";
}

async function replyWithBotError(context: Context, error: unknown) {
  if (error instanceof MarketAnalysisRequestError) {
    await context.reply(error.message);
    return;
  }

  if (isPolymarketApiError(error)) {
    await context.reply(`Polymarket request failed: ${error.message}`);
    return;
  }

  await context.reply(
    "ResolveRadar could not complete that request right now. Please try again in a moment."
  );
}

async function handleMarketInput(context: Context, input: string) {
  await context.replyWithChatAction("typing");

  try {
    const result = await runMarketAnalysis({
      input,
      triggerSource: "TELEGRAM"
    });

    await context.reply(formatTelegramAnalysisReply(result), {
      link_preview_options: {
        is_disabled: true
      }
    });

    logTelegramInfo("market_analysis", "Telegram market analysis sent", {
      slug: result.slug,
      analysisRunId: result.analysisRun.id,
      cached: result.analysisRun.cached,
      commentsFetched: result.commentsFetched
    });
  } catch (error) {
    logTelegramError("market_analysis", error, {
      input
    });
    await replyWithBotError(context, error);
  }
}

async function handleWatchCommand(context: Context) {
  const rawArgument = commandArgument(context as CommandContext).toLowerCase();
  const kind = rawArgument === "soon" || rawArgument === "risky" ? rawArgument : null;

  if (!kind) {
    await context.reply("Use /watch soon or /watch risky.");
    return;
  }

  if (!env.DATABASE_URL) {
    await context.reply("DATABASE_URL must be configured before watchlists can be read.");
    return;
  }

  try {
    const entries = await readGeneratedWatchEntries(
      mapWatchApiKind(kind),
      env.TELEGRAM_WATCH_LIMIT
    );

    await context.reply(formatTelegramWatchReply(kind, entries), {
      link_preview_options: {
        is_disabled: true
      }
    });
  } catch (error) {
    logTelegramError("watch_command", error, { kind });
    await context.reply(
      "ResolveRadar could not load the stored watchlist right now. Please try again shortly."
    );
  }
}

export function createTelegramBot() {
  if (!env.TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN is required to run the Telegram bot.");
  }

  const bot = new Bot(env.TELEGRAM_BOT_TOKEN);

  bot.catch((error) => {
    logTelegramError("bot_runtime", error.error, {
      updateId: error.ctx.update.update_id
    });
  });

  bot.command("start", async (context) => {
    await context.reply(
      [
        "ResolveRadar helps you read a Polymarket market more carefully.",
        "",
        "Send /market <url-or-slug> or paste a Polymarket URL directly.",
        "Use /watch soon or /watch risky to review stored watchlists.",
        "",
        "Informational summaries only. No trading guidance is provided."
      ].join("\n")
    );
  });

  bot.command("help", async (context) => {
    await context.reply(formatTelegramHelpReply());
  });

  bot.command("market", async (context) => {
    const input = commandArgument(context as CommandContext);

    if (!input) {
      await context.reply("Use /market <polymarket-url-or-slug>.");
      return;
    }

    await handleMarketInput(context, input);
  });

  bot.command("watch", handleWatchCommand);

  bot.on("message:text", async (context) => {
    const text = context.message.text.trim();

    if (!text || text.startsWith("/")) {
      return;
    }

    if (!text.includes("polymarket.com/")) {
      return;
    }

    const slug = extractPolymarketSlug(text);

    if (!slug) {
      logTelegramWarn("message_input", "Could not parse Polymarket slug from message", {
        text
      });
      await context.reply("That did not look like a valid Polymarket market URL.");
      return;
    }

    await handleMarketInput(context, text);
  });

  return bot;
}

export async function syncTelegramCommands(bot: Bot) {
  await bot.api.setMyCommands([
    { command: "start", description: "Intro and usage" },
    { command: "help", description: "Command reference" },
    { command: "market", description: "Analyze a market URL or slug" },
    { command: "watch", description: "Read the stored watchlist" }
  ]);
}
