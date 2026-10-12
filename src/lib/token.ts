import crypto from "node:crypto";
import { z } from "zod";

export const TokenRequestSchema = z
  .object({
    picture_complete: z.boolean(),
    comprehension_pass: z.boolean(),
    loans_count: z.number().int().min(1).max(4),
  })
  .strict();

export type TokenRequest = z.infer<typeof TokenRequestSchema>;

export function signTokenPayload(
  secret: string,
  payload: {
    userId: string;
    issuedAt: string;
    pictureComplete: boolean;
    comprehensionPass: boolean;
    loansCount: number;
  },
): string {
  const message = [
    payload.userId,
    payload.issuedAt,
    payload.pictureComplete,
    payload.comprehensionPass,
    payload.loansCount,
  ].join("|");

  return crypto.createHmac("sha256", secret).update(message).digest("hex");
}
