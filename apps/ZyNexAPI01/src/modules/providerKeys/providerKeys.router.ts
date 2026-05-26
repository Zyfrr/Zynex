import { Router } from "express";
import { prisma } from "../../config/database";
import { asyncHandler } from "../../utils/asyncHandler";
import { getUserIdFromRequest } from "../../utils/authRequest";

export const providerKeysRouter = Router();

providerKeysRouter.get(
  "/ZyNexAPI01ProviderKeys",
  asyncHandler(async (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ success: false, error: { code: "AUTH001", message: "Please login again.", details: {} } });
    const keys = await prisma.userProviderKey.findMany({ where: { userId }, orderBy: { provider: "asc" } });
    res.json({
      success: true,
      data: keys.map((key) => ({
        provider: key.provider,
        maskedKey: maskKey(key.apiKey),
        updatedAt: key.updatedAt
      }))
    });
  })
);

providerKeysRouter.put(
  "/ZyNexAPI01ProviderKeys/:Provider",
  asyncHandler(async (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ success: false, error: { code: "AUTH001", message: "Please login again.", details: {} } });
    const provider = String(req.params.Provider);
    const apiKey = typeof req.body?.apiKey === "string" ? req.body.apiKey.trim() : "";
    if (!apiKey) return res.status(400).json({ success: false, error: { code: "VAL001", message: "API key is required.", details: {} } });
    const key = await prisma.userProviderKey.upsert({
      where: { userId_provider: { userId, provider } },
      update: { apiKey },
      create: { userId, provider, apiKey }
    });
    res.json({ success: true, data: { provider: key.provider, maskedKey: maskKey(key.apiKey), updatedAt: key.updatedAt } });
  })
);

export async function getProviderKey(userId: string, provider: string) {
  const key = await prisma.userProviderKey.findUnique({ where: { userId_provider: { userId, provider } } });
  return key?.apiKey;
}

function maskKey(value: string) {
  if (value.length <= 10) return "********";
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}
