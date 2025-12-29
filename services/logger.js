// services/logger.js - Sistema de logging simplificado para Iconic Chatbot
const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Crear carpeta logs si no existe
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Configuración básica del logger
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    defaultMeta: { service: 'iconic-chatbot' },
    transports: [
        // Console output
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        // File for all logs
        new winston.transports.File({
            filename: path.join(logDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // File for errors only
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            maxsize: 5242880,
            maxFiles: 3
        })
    ]
});

// Métodos personalizados para el chatbot
logger.logInteraction = function(userId, platform, messageType, data = {}) {
    const safeUserId = userId ? userId.replace(/[0-9]/g, 'X') : 'anonymous';
    
    this.info('INTERACTION_LOG', {
        timestamp: new Date().toISOString(),
        userId: safeUserId,
        platform: platform,
        messageType: messageType,
        ...data
    });
};

logger.logAppointment = function(appointmentData) {
    this.info('APPOINTMENT_LOG', {
        timestamp: new Date().toISOString(),
        appointmentId: `app_${Date.now()}`,
        procedure: appointmentData.procedure,
        date: appointmentData.date,
        time: appointmentData.time,
        status: appointmentData.status || 'PENDING'
    });
};

logger.logError = function(error, context = {}) {
    this.error('ERROR_LOG', {
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack ? error.stack.substring(0, 200) : 'No stack',
        ...context
    });
};

// Middleware para Express
logger.expressMiddleware = function(req, res, next) {
    const start = Date.now();
    
    // Log cuando la respuesta termina
    res.on('finish', () => {
        const duration = Date.now() - start;
        
        this.info('HTTP_REQUEST', {
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: duration + 'ms',
            timestamp: new Date().toISOString()
        });
    });
    
    next();
};

module.exports = logger;