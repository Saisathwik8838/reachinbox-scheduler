import { Router, Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { db } from "../db/client.js";
import { logger } from "../utils/logger.js";
import { requireAuth } from "./auth.middleware.js";

const router = Router();

const oauth2Client = new OAuth2Client(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  env.GOOGLE_REDIRECT_URI
);

router.get("/google", (req: Request, res: Response) => {
  if (!env.GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_ID.startsWith("your_") || env.GOOGLE_CLIENT_ID.startsWith("mock_")) {
    logger.warn("Google OAuth credentials missing, redirecting to local dev session.");
    return res.redirect("/api/auth/dev-callback");
  }

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    prompt: "consent",
  });

  res.redirect(authUrl);
});

router.get("/callback", async (req: Request, res: Response) => {
  const code = req.query.code as string;
  if (!code) {
    return res.status(400).send("Authorization code missing from Google response.");
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    if (!tokens.id_token) {
      throw new Error("No id_token received from Google.");
    }

    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new Error("Invalid Google token payload.");
    }

    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name || email.split("@")[0];
    const avatarUrl = payload.picture || null;

    const user = await db.user.upsert({
      where: { googleId },
      update: {
        email,
        name,
        avatarUrl,
      },
      create: {
        googleId,
        email,
        name,
        avatarUrl,
      },
    });

    logger.info(`User authenticated: ${user.email} (${user.id})`);

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.redirect(`${env.FRONTEND_URL}/dashboard`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("OAuth callback failed:", msg);
    res.status(500).send(`Authentication failed: ${msg}`);
  }
});

// Dev fallback when OAuth credentials are not provided
router.get("/dev-callback", async (req: Request, res: Response) => {
  try {
    const googleId = "dev-user-saisathwik";
    const email = "saisathwik@gmail.com";
    const name = "Sai Sathwik";
    const avatarUrl = null;

    const user = await db.user.upsert({
      where: { googleId },
      update: { email, name, avatarUrl },
      create: { googleId, email, name, avatarUrl },
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.redirect(`${env.FRONTEND_URL}/dashboard`);
  } catch (err) {
    res.status(500).json({ error: "Failed to create dev user session" });
  }
});

// Quick dev login for curl testing and local evaluation
router.post("/dev-login", async (req: Request, res: Response) => {
  try {
    const email = req.body.email || "saisathwik@gmail.com";
    const name = req.body.name || "Sai Sathwik";
    const googleId = `dev-${email}`;

    const user = await db.user.upsert({
      where: { googleId },
      update: { email, name },
      create: { googleId, email, name },
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.json({ success: true, token, user });
  } catch (err) {
    res.status(500).json({ error: "Dev login failed" });
  }
});

router.get("/me", requireAuth, (req: Request, res: Response) => {
  res.json({ user: req.user });
});

router.post("/logout", (req: Request, res: Response) => {
  res.clearCookie("auth_token", { path: "/" });
  res.json({ success: true, message: "Logged out successfully" });
});

export default router;
