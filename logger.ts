const winston = require('winston');
const { combine, timestamp, printf, label, colorize, json } = winston.format;
require('winston-loggly');
require('winston-papertrail');
require('winston-daily-rotate-file');
const env = process.env.NODE_ENV || 'development';
const db = require('./db'); // import your database connection
const config = require('./config'); // import your config file

// Custom format that includes timestamp, level, and message
const customFormat = printf(info => {
    return `[${info.timestamp}] [${info.level.toUpperCase()}]: ${info.message}`;
});

const logTransports = [
    new winston.transports.Console({
        format: combine(
            colorize(),
            label({ label: 'Logger' }),
            timestamp(),
            customFormat
        )
    }),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
];

if (env === 'production') {
    logTransports.push(new winston.transports.Loggly({
        token: config.loggly.token,
        subdomain: config.loggly.subdomain,
        tags: ["Winston-NodeJS"],
        json: true
    }));
    logTransports.push(new winston.transports.Papertrail({
        host: config.papertrail.host,
        port: config.papertrail.port,
        level: 'error'
    }));
}

const rotateTransport = new winston.transports.DailyRotateFile({
    filename: 'application-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d'
});

logTransports.push(rotateTransport);

if(config.logToDB) {
    logTransports.push(new winston.transports.MongoDB({
        db: db.connection,
        collection: 'logs',
        storeHost: true
    }));
}

const logger = winston.createLogger({
    level: env === 'production' ? 'error' : 'debug',
    format: combine(
        json(),
        timestamp(),
        customFormat
    ),
    transports: logTransports,
    exceptionHandlers: [
        new winston.transports.File({ filename: 'exceptions.log' }),
    ],
    exitOnError: false
});

const log = (level, message, context) => {
    context = context || {};
    context.correlationId = context.correlationId ||  generateCorrelationId();
    logger.log({ level, message, ...context });
}

function generateCorrelationId(){
  // code to generate unique correlation ID
}
