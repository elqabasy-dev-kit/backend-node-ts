/**
 * @file middlewares/logger.middleware.ts
 * @description Middleware to log all incoming requests and outgoing responses with detailed context, including security-related information. It also persists logs to a database and emits security events for SOC monitoring.
 */

import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { v4 as uuidv4 } from "uuid";
import geoip from "geoip-lite";
import { emitSecurityEvent } from "../utils/socket.util";

import { prisma } from "../db";

const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const start = process.hrtime();
    const requestId = uuidv4();

    // Attach requestId to request
    (req as any).requestId = requestId;
    res.setHeader('X-Request-ID', requestId);

    res.on('finish', async () => {
        const diff = process.hrtime(start);
        const durationMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
        const ip = req.ip || req.socket.remoteAddress || "";
        const geo = geoip.lookup(ip);

        // Sanitize body (exclude sensitive fields)
        const sanitizedBody = { ...req.body };
        const sensitiveKeys = ['password', 'token', 'secret', 'otp', 'code'];
        sensitiveKeys.forEach(key => {
            if (sanitizedBody && typeof sanitizedBody === 'object' && key in sanitizedBody) {
                sanitizedBody[key] = '***';
            }
        });

        // Capture security context from res.locals
        const securityContext = res.locals.security || {
            riskLevel: res.statusCode >= 400 ? 'medium' : 'low',
            eventType: 'access',
            isThreat: res.statusCode >= 400
        };


        const logData = {
            requestId,
            ip,
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            durationMs: Number(durationMs),
            userAgent: req.headers['user-agent'],
            userId: (req as any).user?.id,
            geo: geo ? {
                country: geo.country,
                city: geo.city,
                coordinates: geo.ll
            } : null,
            referer: req.headers['referer'],
            body: sanitizedBody && Object.keys(sanitizedBody).length > 0 ? sanitizedBody : undefined,
            security: securityContext
        };

        logger.info("Request processed", logData);

        // PERSIST LOG TO DATABASE (PostgreSQL via Prisma)
        try {
            await (prisma as any).log.create({
                data: {
                    level: "info",
                    message: "Request processed",
                    metadata: logData,
                    timestamp: new Date()
                }
            });
        } catch (dbErr: any) {
            console.error("[LoggerMiddleware] Failed to persist log:", dbErr.message);
        }

        // Broadcast "Live Attack" to SOC dashboard via WebSockets
        if (securityContext.isThreat) {
            emitSecurityEvent(logData);
        }
    });

    next();
}

export { loggerMiddleware }
