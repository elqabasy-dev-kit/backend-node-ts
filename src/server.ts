import http from 'node:http';

import { createApp } from './app';
import { config } from './config';
import { prisma } from './db';
import { initSocket } from './utils/socket.util';
import { logger } from './utils/logger.util';

const app = createApp();
const server = http.createServer(app);

/**
 * Initialize WebSocket layer
 */
initSocket(server);

/**
 * Graceful shutdown handler
 */
const gracefulShutdown = async (signal: NodeJS.Signals): Promise<void> => {
    logger.info(`${signal} received. Starting graceful shutdown...`);

    try {
        // Stop accepting new connections
        server.close(async (serverError) => {
            if (serverError) {
                logger.error('Error while closing HTTP server', {
                    message: serverError.message,
                    stack: serverError.stack,
                });

                process.exit(1);
            }

            try {
                // Disconnect database
                await prisma.$disconnect().catch((dbError) => {
                    logger.error('Error while disconnecting database', {
                        message: dbError.message,
                        stack: dbError.stack,
                    });
                }).finally(() => {
                    logger.info('Prisma disconnected.');
                });

                logger.info('HTTP server closed.');
                logger.info('Prisma disconnected.');
                logger.info('Shutdown completed successfully.');

                process.exit(0);
            } catch (dbError: any) {
                logger.error('Error during database disconnection', {
                    message: dbError.message,
                    stack: dbError.stack,
                });

                process.exit(1);
            }
        });

        /**
         * Force shutdown fallback
         * Prevent hanging processes
         */
        setTimeout(() => {
            logger.error('Forced shutdown due to timeout.');
            process.exit(1);
        }, 10_000).unref();

    } catch (error: any) {
        logger.error('Unexpected error during shutdown', {
            message: error.message,
            stack: error.stack,
        });

        process.exit(1);
    }
};

/**
 * Global process error handlers
 */
process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught exception detected', {
        message: error.message,
        stack: error.stack,
    });

    process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
    const error =
        reason instanceof Error
            ? reason
            : new Error(`Unhandled rejection: ${String(reason)}`);

    logger.error('Unhandled promise rejection detected', {
        message: error.message,
        stack: error.stack,
    });

    process.exit(1);
});

/**
 * OS shutdown signals
 */
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

/**
 * Bootstrap server
 */
const startServer = async (): Promise<void> => {
    try {
        await prisma.$connect();

        server.listen(config.server.port, () => {
            logger.info(`Server started successfully on port ${config.server.port}`);
        });
    } catch (error: any) {
        logger.error('Failed to start server', {
            message: error.message,
            stack: error.stack,
        });

        await gracefulShutdown('SIGTERM');
    }
};

void startServer();