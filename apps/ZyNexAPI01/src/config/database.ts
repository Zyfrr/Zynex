import { PrismaClient } from "@prisma/client";

declare global {
  var zynexPrisma: PrismaClient | undefined;
}

export const prisma = globalThis.zynexPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.zynexPrisma = prisma;
}
