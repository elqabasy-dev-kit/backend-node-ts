/**
 * @file src/db/prisma.client.ts
 * @description Prisma client setup using the new Prisma 7 adapter system for direct database connections.
 * @author Mahros AL-Qabasy <mahros.dev>
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { logger } from "../utils/logger.util";
import { config } from "../config";

/**
 * Prisma client singleton to prevent multiple instances
 * especially useful in development with hot-reloading
 * and in serverless environments.
 *
 * Note: Prisma 7 requires a driver adapter (like @prisma/adapter-pg)
 * for direct database connections.
 */
class PrismaService {
  private static instance: PrismaClient | null = null;

  private constructor() { }

  public static getInstance(): PrismaClient {
    if (!PrismaService.instance) {
      // 1. Create the pg pool
      const pool = new Pool({
        connectionString: config.prisma.postgresUri,
      });

      // 2. Instantiate the adapter
      const adapter = new PrismaPg(pool);

      // 3. Create the client with the adapter
      PrismaService.instance = new PrismaClient({
        adapter,
        log: [
          { emit: "event", level: "query" },
          { emit: "event", level: "error" },
          { emit: "event", level: "info" },
          { emit: "event", level: "warn" },
        ],
      });

      // Hook into lifecycle events
      (PrismaService.instance as any).$on("query", (e: any) => {
        // Only log queries in development if needed
        // logger.debug(`Query: ${e.query} ${e.params}`);
      });

      (PrismaService.instance as any).$on("error", (e: any) => {
        logger.error(`Prisma Error: ${e.message}`, { target: e.target });
      });

      (PrismaService.instance as any).$on("info", (e: any) => {
        logger.info(`Prisma Info: ${e.message}`);
      });

      (PrismaService.instance as any).$on("warn", (e: any) => {
        logger.warn(`Prisma Warning: ${e.message}`);
      });

      // Initial connection check
      PrismaService.instance
        .$connect()
        .then(() => {
          logger.info(
            "[Prisma] Database connected successfully (via Adapter).",
          );
        })
        .catch((error: Error) => {
          logger.error("[Prisma] Database connection failed:", error);
          // In production, you might not want to exit immediately if other services can work
          // but for a DB-driven API, it's often better to fail fast.
          process.exit(1);
        });
    }

    return PrismaService.instance;
  }
}

export const prisma = PrismaService.getInstance();
