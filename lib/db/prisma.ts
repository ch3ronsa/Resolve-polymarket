import { PrismaClient } from "@prisma/client";

import { env } from "@/lib/env";

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

export function getPrismaClient() {
  if (!env.DATABASE_URL) {
    return null;
  }

  if (!globalThis.prismaGlobal) {
    globalThis.prismaGlobal = new PrismaClient();
  }

  return globalThis.prismaGlobal;
}

