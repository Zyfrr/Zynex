import { Router } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { loginSchema, registerSchema } from "./auth.schema";

export const authRouter = Router();

authRouter.post(
  "/Register",
  asyncHandler(async (req, res) => {
    const body = registerSchema.parse(req.body);
    res.status(201).json({
      success: true,
      data: {
        user: { id: "ZyNexUser1001", name: body.name, email: body.email },
        accessToken: "ZyNexDevToken1001"
      }
    });
  })
);

authRouter.post(
  "/Login",
  asyncHandler(async (req, res) => {
    const body = loginSchema.parse(req.body);
    res.json({
      success: true,
      data: {
        user: { id: "ZyNexUser1001", name: "ZyNex Operator", email: body.email },
        accessToken: "ZyNexDevToken1001"
      }
    });
  })
);

authRouter.get(
  "/Me",
  asyncHandler(async (_req, res) => {
    res.json({
      success: true,
      data: { id: "ZyNexUser1001", name: "ZyNex Operator", email: "operator@zynex.local" }
    });
  })
);
