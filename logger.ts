const winston = require('winston');
const moment = require('moment');
const { combine, timestamp, printf, label, colorize } = winston.format;
require('winston-loggly');
require('winston-daily-rotate-file');
const env = process.env.NODE_ENV || 'development';

// Custom format that includes timestamp, level, and message
const customFormat = printf(info => {
    return `[${moment().format()}] [${info.level.toUpperCase()}]: ${info.message}`;
});

const logTransports = [
    new winston.transports.Console({
        format: combine(
            colorize(),
            label({ label: 'Logger' }),
            customFormat
        )
    }),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
];

if (env === 'production') {
    logTransports.push(new winston.transports.Loggly({
        token: "your-loggly-token",
        subdomain: "your-loggly-subdomain",
        tags: ["Winston-NodeJS"],
        json: true
    }))
}

const rotateTransport = new winston.transports.DailyRotateFile({
    filename: 'application-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d'
});

logTransports.push(rotateTransport);

const logger = winston.createLogger({
    level: env === 'production' ? 'error' : 'debug',
    format: combine(
        timestamp(),
        customFormat
    ),
    transports: logTransports,
    exceptionHandlers: [
        new winston.transports.File({ filename: 'exceptions.log' }),
    ],
    exitOnError: false
});

const log = (level, message) => {
    logger.log({ level, message });
}

module.exports = {
    log: log,
    info: (message) => {
        log('info', message);
    },
    debug: (message) => {
        log('debug', message);
    },
    warn: (message) => {
        log('warn', message);
    },
    error: (message) => {
        log('error', message);
    }
};
