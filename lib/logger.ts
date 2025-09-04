/**
 * Winston Logger Configuration
 * Provides structured logging with different levels and transports
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { NextRequest } from 'next/server';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston about our colors
winston.addColors(colors);

// Format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, correlationId, ...extra } = info;
    const extraStr = Object.keys(extra).length ? JSON.stringify(extra, null, 2) : '';
    return `${timestamp} ${level}: ${correlationId ? `[${correlationId}] ` : ''}${message} ${extraStr}`;
  })
);

// Format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.uncolorize(),
  winston.format.json()
);

// Create transports array
const transports: winston.transport[] = [];

// Console transport (always enabled in development)
if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_CONSOLE_LOGS === 'true') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: process.env.LOG_LEVEL || 'debug',
    })
  );
}

// File transports for production
if (process.env.NODE_ENV === 'production') {
  // Error logs
  transports.push(
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: fileFormat,
      maxFiles: '30d',
      maxSize: '20m',
    })
  );

  // Combined logs
  transports.push(
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      format: fileFormat,
      maxFiles: '14d',
      maxSize: '20m',
    })
  );

  // Security audit logs
  transports.push(
    new DailyRotateFile({
      filename: 'logs/security-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'info',
      format: fileFormat,
      maxFiles: '90d',
      maxSize: '20m',
      auditFile: 'logs/security-audit.json',
    })
  );
}

// Create the logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  levels,
  transports,
  exitOnError: false,
});

// Create security logger for audit events
const securityLogger = winston.createLogger({
  level: 'info',
  format: fileFormat,
  transports: process.env.NODE_ENV === 'production' ? [
    new DailyRotateFile({
      filename: 'logs/security-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '90d',
      maxSize: '20m',
    })
  ] : [
    new winston.transports.Console({
      format: consoleFormat,
    })
  ],
});

// Helper to generate correlation ID
export function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Helper to extract request metadata
export function getRequestMetadata(request?: NextRequest) {
  if (!request) return {};
  
  return {
    method: request.method,
    url: request.url,
    ip: request.headers.get('x-forwarded-for') || 
        request.headers.get('x-real-ip') || 
        'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    referer: request.headers.get('referer') || 'direct',
  };
}

// Enhanced logging methods with correlation ID support
export const log = {
  error: (message: string, error?: any, meta?: Record<string, any>) => {
    const errorMeta = error ? {
      errorMessage: error.message || String(error),
      errorStack: error.stack,
      errorCode: error.code,
      ...meta
    } : meta;
    
    logger.error(message, errorMeta);
  },

  warn: (message: string, meta?: Record<string, any>) => {
    logger.warn(message, meta);
  },

  info: (message: string, meta?: Record<string, any>) => {
    logger.info(message, meta);
  },

  http: (message: string, meta?: Record<string, any>) => {
    logger.http(message, meta);
  },

  debug: (message: string, meta?: Record<string, any>) => {
    logger.debug(message, meta);
  },

  // Security-specific logging
  security: {
    success: (action: string, userId?: string, meta?: Record<string, any>) => {
      securityLogger.info(`Security: ${action} succeeded`, {
        action,
        userId,
        success: true,
        timestamp: new Date().toISOString(),
        ...meta
      });
    },

    failure: (action: string, userId?: string, reason?: string, meta?: Record<string, any>) => {
      securityLogger.warn(`Security: ${action} failed`, {
        action,
        userId,
        success: false,
        reason,
        timestamp: new Date().toISOString(),
        ...meta
      });
    },

    alert: (message: string, severity: 'low' | 'medium' | 'high' | 'critical', meta?: Record<string, any>) => {
      securityLogger.error(`Security Alert: ${message}`, {
        severity,
        alert: true,
        timestamp: new Date().toISOString(),
        ...meta
      });
    }
  },

  // API request logging
  api: {
    request: (correlationId: string, request: NextRequest, userId?: string) => {
      logger.http('API Request', {
        correlationId,
        userId,
        ...getRequestMetadata(request),
        timestamp: new Date().toISOString()
      });
    },

    response: (correlationId: string, status: number, duration: number, error?: string) => {
      const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'http';
      logger.log(level, 'API Response', {
        correlationId,
        status,
        duration,
        error,
        timestamp: new Date().toISOString()
      });
    },

    error: (correlationId: string, error: any, request?: NextRequest) => {
      logger.error('API Error', {
        correlationId,
        error: error.message || String(error),
        stack: error.stack,
        code: error.code || error.statusCode,
        ...getRequestMetadata(request),
        timestamp: new Date().toISOString()
      });
    }
  },

  // Database query logging
  db: {
    query: (operation: string, model: string, duration: number, meta?: Record<string, any>) => {
      const level = duration > 1000 ? 'warn' : 'debug';
      logger.log(level, `DB Query: ${operation} on ${model}`, {
        operation,
        model,
        duration,
        slow: duration > 1000,
        ...meta,
        timestamp: new Date().toISOString()
      });
    },

    error: (operation: string, model: string, error: any) => {
      logger.error(`DB Error: ${operation} on ${model}`, {
        operation,
        model,
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString()
      });
    }
  }
};

// Export logger instance for direct use if needed
export default logger;

// Utility to create child logger with default metadata
export function createChildLogger(defaultMeta: Record<string, any>) {
  return logger.child(defaultMeta);
}

// Log unhandled errors
if (typeof process !== 'undefined') {
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    log.error('Unhandled Rejection', reason, { promise: String(promise) });
  });

  process.on('uncaughtException', (error: Error) => {
    log.error('Uncaught Exception', error);
    // Give the logger time to write before exiting
    setTimeout(() => process.exit(1), 1000);
  });
}