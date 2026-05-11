/**
 * @file src/config/index.ts
 * @description Application configuration loaded from environment variables with validation.
 * @author Mahros AL-Qabasy <mahros.dev>
 */

import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

import { HttpStatus } from "../constants/httpStatus";

dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
});

/**
 * Environment Schema
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  PORT: z.coerce.number().default(3030),

  /**
   * Database
   */
  POSTGRES_URI: z.string().min(1),

  /**
   * JWT
   */
  JWT_SECRET: z
    .string()
    .length(32, "JWT_SECRET must be exactly 32 characters"),

  JWT_REFRESH_SECRET: z.string().min(1),

  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  JWT_ACCESS_TOKEN_EXPIRES_IN: z.string().default("15m"),

  /**
   * Storage
   */
  STORAGE_ENDPOINT: z.string().min(1),

  STORAGE_BUCKET: z.string().default(""),

  STORAGE_ACCESS_KEY_ID: z.string().min(1),

  STORAGE_SECRET_ACCESS_KEY: z.string().min(1),

  STORAGE_REGION: z.string().default("us-east-1"),

  STORAGE_FORCE_PATH_STYLE: z
    .string()
    .optional()
    .transform((value: string | undefined) => value !== "false"),

  /**
   * 2FA
   */
  AUTH_2FA_SECRET_LENGTH: z.coerce.number().default(20),

  AUTH_2FA_OTP_LENGTH: z.coerce.number().default(6),

  AUTH_2FA_OTP_EXPIRES_IN: z.string().default("5m"),

  AUTH_2FA_RATE_LIMIT_WINDOW_MS: z.coerce
    .number()
    .default(15 * 60 * 1000),

  AUTH_2FA_RATE_LIMIT_MAX: z.coerce.number().default(5),

  TWO_FACTOR_ISSUER: z.string().default("mahros.dev"),

  /**
   * WebAuthn
   */
  WEBAUTHN_RP_NAME: z.string().default("mahros"),

  WEBAUTHN_RP_ID: z.string().default("localhost"),

  WEBAUTHN_ORIGIN: z
    .string()
    .url()
    .default("http://localhost:3000"),

  WEBAUTHN_CHALLENGE_TIMEOUT_MS: z.coerce
    .number()
    .default(60_000),

  WEBAUTHN_CHALLENGE_EXPIRES_IN_MS: z.coerce
    .number()
    .default(5 * 60 * 1000),

  /**
   * Auth Rate Limits
   */
  AUTH_RATE_LIMIT_MAX: z.coerce.number().default(20),

  AUTH_OTP_RATE_LIMIT_WINDOW_MS: z.coerce
    .number()
    .default(5 * 60 * 1000),

  AUTH_OTP_RATE_LIMIT_MAX: z.coerce.number().default(5),

  AUTH_OTP_LOCKOUT_MAX_ATTEMPTS: z.coerce
    .number()
    .default(5),

  AUTH_OTP_LOCKOUT_DURATION_MS: z.coerce
    .number()
    .default(10 * 60 * 1000),

  /**
   * Brand
   */
  BRAND_LOGO_FILE_NAME: z
    .string()
    .default("favicon-96x96.png"),

  BRAND_QR_WIDTH: z.coerce.number().default(320),

  BRAND_QR_MARGIN: z.coerce.number().default(1),

  BRAND_QR_LOGO_SCALE: z.coerce.number().default(0.22),

  BRAND_QR_LOGO_OPACITY: z.coerce
    .number()
    .default(0.68),

  BRAND_QR_DARK_COLOR: z
    .string()
    .default("#0A2D5E"),

  BRAND_QR_LIGHT_COLOR: z
    .string()
    .default("#FFFFFF"),

  BRAND_QR_LOGO_BG_COLOR: z
    .string()
    .default("#FFFFFF"),
});

/**
 * Validate Environment Variables
 */
const env = envSchema.parse(process.env);

/**
 * Prisma compatibility
 */
process.env.DATABASE_URL = env.POSTGRES_URI;

/**
 * Application Config
 */
export const config = {
  prisma: {
    postgresUri: env.POSTGRES_URI,
  },

  server: {
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
    serverErrorCode: HttpStatus.INTERNAL_SERVER_ERROR,
    allowedDomains: [
      "localhost",
      "127.0.0.1",
    ],
  },

  auth: {
    saltRounds: 10,

    jwt: {
      secret: env.JWT_SECRET,
      refreshSecret: env.JWT_REFRESH_SECRET,
      refreshTokenExpiresIn:
        env.JWT_REFRESH_EXPIRES_IN,

      accessTokenExpiresIn:
        env.JWT_ACCESS_TOKEN_EXPIRES_IN,
    },

    twoFactor: {
      secretLength:
        env.AUTH_2FA_SECRET_LENGTH,

      otpLength:
        env.AUTH_2FA_OTP_LENGTH,

      otpExpiresIn:
        env.AUTH_2FA_OTP_EXPIRES_IN,

      rateLimitWindowMs:
        env.AUTH_2FA_RATE_LIMIT_WINDOW_MS,

      rateLimitMax:
        env.AUTH_2FA_RATE_LIMIT_MAX,

      issuer: env.TWO_FACTOR_ISSUER,
    },

    webAuthn: {
      rpName: env.WEBAUTHN_RP_NAME,
      rpId: env.WEBAUTHN_RP_ID,
      origin: env.WEBAUTHN_ORIGIN,

      challengeTimeoutMs:
        env.WEBAUTHN_CHALLENGE_TIMEOUT_MS,

      challengeExpiresInMs:
        env.WEBAUTHN_CHALLENGE_EXPIRES_IN_MS,
    },

    rateLimit: {
      authMax: env.AUTH_RATE_LIMIT_MAX,

      otpWindowMs:
        env.AUTH_OTP_RATE_LIMIT_WINDOW_MS,

      otpMax:
        env.AUTH_OTP_RATE_LIMIT_MAX,

      lockoutMaxAttempts:
        env.AUTH_OTP_LOCKOUT_MAX_ATTEMPTS,

      lockoutDurationMs:
        env.AUTH_OTP_LOCKOUT_DURATION_MS,
    },
  },

  brand: {
    identityAssetsDir: path.resolve(
      process.cwd(),
      "assets",
    ),

    logoFileName:
      env.BRAND_LOGO_FILE_NAME,

    qr: {
      width: env.BRAND_QR_WIDTH,
      margin: env.BRAND_QR_MARGIN,

      logoScale:
        env.BRAND_QR_LOGO_SCALE,

      logoOpacity:
        env.BRAND_QR_LOGO_OPACITY,

      darkColor:
        env.BRAND_QR_DARK_COLOR,

      lightColor:
        env.BRAND_QR_LIGHT_COLOR,

      logoBackgroundColor:
        env.BRAND_QR_LOGO_BG_COLOR,
    },
  },

  storage: {
    endpoint: env.STORAGE_ENDPOINT,

    bucket: env.STORAGE_BUCKET,

    accessKeyId:
      env.STORAGE_ACCESS_KEY_ID,

    secretAccessKey:
      env.STORAGE_SECRET_ACCESS_KEY,

    region: env.STORAGE_REGION,

    forcePathStyle:
      env.STORAGE_FORCE_PATH_STYLE,
  },
} as const;

export type Env = z.infer<typeof envSchema>;