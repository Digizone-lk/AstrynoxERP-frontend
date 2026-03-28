import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().min(1, "NEXT_PUBLIC_API_URL is required"),
});

function validateEnv() {
  const result = envSchema.safeParse({
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  });

  if (!result.success) {
    const missing = result.error.errors.map((e) => e.message).join(", ");
    throw new Error(`Environment configuration error: ${missing}`);
  }

  return result.data;
}

export const env = validateEnv();
