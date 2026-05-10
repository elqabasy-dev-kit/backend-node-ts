import { createLogger, format, transports } from 'winston';

const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp(),
        format.json()
    ),
    transports: [
        new transports.Console(),
        // You can add other transports here, like a file transport or a cloud logging service
        // For now, we are removing the MongoDB transport as we move to PostgreSQL
    ],
});


export { logger };
