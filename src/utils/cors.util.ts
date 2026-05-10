/**
 * @file utils/cors.util.ts
 * @description CORS configuration utility
 * @author Mahros ALQabasy <mahros.dev>
 */

import cors, { type CorsOptions } from 'cors';
import { config } from '../config';

/**
 * Build secure CORS configuration
 */
const buildCorsOptions = (): CorsOptions => {
    const allowedDomains = config.server.allowedDomains;

    return {
        origin: (
            origin: string | undefined,
            callback: (error: Error | null, allow?: boolean) => void,
        ) => {
            /**
             * Allow non-browser clients
             * (mobile apps, curl, internal services, Postman)
             */
            if (!origin) {
                return callback(null, true);
            }

            try {
                const parsedOrigin = new URL(origin);

                const hostname = parsedOrigin.hostname.toLowerCase();
                const host = parsedOrigin.host.toLowerCase();

                const isAllowed = allowedDomains.some((domain) => {
                    return (
                        host === domain ||
                        hostname === domain ||
                        hostname.endsWith(`.${domain}`)
                    );
                });

                if (!isAllowed) {
                    return callback(
                        new Error(`CORS policy violation for origin: ${origin}`),
                    );
                }

                return callback(null, true);
            } catch {
                return callback(new Error('Invalid CORS origin'));
            }
        },

        credentials: true,

        methods: [
            'GET',
            'POST',
            'PUT',
            'PATCH',
            'DELETE',
            'OPTIONS',
        ],

        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'X-Lang',
            'X-Skip-Auth-Failure',
            'X-Skip-Error-Toast',
        ],
    };
};


export default buildCorsOptions;