/**
 * @file app.ts
 * @description Express application setup with security, CORS, and routing
 * @author Mahros ALQabasy <mahros.dev>
 */

import express, { type Application, type Request, type Response } from 'express';
import cors, { type CorsOptions } from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';



/**
 * Routes
 */
import v1Routes from './routes';


/**
 * Middlewares
 */


import { loggerMiddleware } from './middlewares/logger.middleware';
import buildCorsOptions from './utils/cors.util';




export const createApp = (): Application => {
  const app = express();

  /**
   * Trust reverse proxy
   * Required for rate limiting, IP detection, HTTPS forwarding
   */
  app.set('trust proxy', 1);

  /**
   * Security headers
   */
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'none'"],
          formAction: ["'none'"],
        },
      },

      crossOriginEmbedderPolicy: false,

      referrerPolicy: {
        policy: 'no-referrer',
      },

      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    }),
  );

  /**
   * Block bots, scanners, suspicious traffic
   */
  // app.use(botMiddleware);

  /**
   * CORS
   */
  app.use(cors(buildCorsOptions()));

  /**
   * Prevent HTTP parameter pollution
   */
  app.use(hpp());

  /**
   * Request body parsers
   */
  app.use(
    express.json({
      limit: '1mb',
    }),
  );

  app.use(
    express.urlencoded({
      extended: true,
      limit: '1mb',
    }),
  );

  /**
   * Request logging
   */
  app.use(loggerMiddleware);



  /**
   * robots.txt
   */
  app.get('/robots.txt', (_req: Request, res: Response) => {
    res.type('text/plain');

    res.send('User-agent: *\nDisallow: /');
  });

  /**
   * Root endpoint
   */
  app.get('/', (_req: Request, res: Response) => {
    return res.status(200).json({
      success: true,
      data: {
        status: 'online',
        service: 'api',
        timestamp: new Date().toISOString(),
      },
    });
  });



  /**
   * API routes
   */
  app.use('/api/v1', v1Routes);

  /**
   * 404 handler
   */
  app.use('/', (_req: Request, res: Response) => {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Route not found',
      },
    });
  });


  return app;
};