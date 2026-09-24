import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { db } from "../db/client.js";

export interface AuthenticatedUser {
  id: string;
  googleId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

interface JwtPayload {
  userId: string;
  email: string;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    let token = req.cookies?.auth_token;

    // Also support Authorization header Bearer token for programmatic API access / tests
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.substring(7);
    }

    if (!token) {
      return res.status(401).json({ error: "Authentication required. Please sign in." });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        googleId: true,
        email: true,
        name: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "User session expired or invalid. Please sign in again." });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired session token" });
  }
}
