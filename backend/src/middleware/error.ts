import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "../utils/logger.js";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  if (err instanceof ZodError) {
    const errorDetails = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
    logger.warn(`Validation error on ${req.method} ${req.originalUrl}: ${errorDetails}`);
    return res.status(400).json({
      error: `Validation error: ${errorDetails}`,
      details: err.errors,
    });
  }

  const message = err instanceof Error ? err.message : "Internal Server Error";
  logger.error(`Unhandled error on ${req.method} ${req.originalUrl}:`, err);

  return res.status(500).json({
    error: message,
  });
}
