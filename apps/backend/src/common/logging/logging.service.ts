import { Injectable, Logger, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  VERBOSE = 'verbose',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  trace?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class LoggingService implements LoggerService {
  private readonly logger = new Logger(LoggingService.name);
  private readonly logDir: string;
  private readonly maxLogSize: number;
  private readonly maxLogFiles: number;

  constructor(private readonly configService: ConfigService) {
    this.logDir = this.configService.get<string>('LOG_DIR', 'logs');
    this.maxLogSize = this.configService.get<number>(
      'MAX_LOG_SIZE',
      10 * 1024 * 1024,
    ); // 10MB
    this.maxLogFiles = this.configService.get<number>('MAX_LOG_FILES', 5);
    this.ensureLogDirectory();
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private getLogFilePath(level: LogLevel): string {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `${level}-${date}.log`);
  }

  private async writeToFile(level: LogLevel, entry: LogEntry): Promise<void> {
    try {
      const logFile = this.getLogFilePath(level);
      const logLine = JSON.stringify(entry) + '\n';

      // Check if file exists and rotate if needed
      if (fs.existsSync(logFile)) {
        const stats = fs.statSync(logFile);
        if (stats.size > this.maxLogSize) {
          await this.rotateLogFile(logFile);
        }
      }

      fs.appendFileSync(logFile, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  private async rotateLogFile(logFile: string): Promise<void> {
    try {
      const dir = path.dirname(logFile);
      const ext = path.extname(logFile);
      const base = path.basename(logFile, ext);

      // Remove oldest log file if we have too many
      for (let i = this.maxLogFiles - 1; i >= 0; i--) {
        const oldFile = path.join(dir, `${base}.${i}${ext}`);
        if (fs.existsSync(oldFile)) {
          if (i === this.maxLogFiles - 1) {
            fs.unlinkSync(oldFile);
          } else {
            fs.renameSync(oldFile, path.join(dir, `${base}.${i + 1}${ext}`));
          }
        }
      }

      // Rename current log file
      const newFile = path.join(dir, `${base}.1${ext}`);
      fs.renameSync(logFile, newFile);
    } catch (error) {
      console.error('Failed to rotate log file:', error);
    }
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: string,
    trace?: string,
    metadata?: Record<string, any>,
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      context: context || 'Application',
      message,
      trace,
      metadata,
    };
  }

  log(message: string, context?: string, metadata?: Record<string, any>): void {
    const entry = this.createLogEntry(
      LogLevel.INFO,
      message,
      context,
      undefined,
      metadata,
    );
    this.logger.log(message, context);
    this.writeToFile(LogLevel.INFO, entry);
  }

  error(
    message: string,
    trace?: string,
    context?: string,
    metadata?: Record<string, any>,
  ): void {
    const entry = this.createLogEntry(
      LogLevel.ERROR,
      message,
      context,
      trace,
      metadata,
    );
    this.logger.error(message, trace, context);
    this.writeToFile(LogLevel.ERROR, entry);
  }

  warn(
    message: string,
    context?: string,
    metadata?: Record<string, any>,
  ): void {
    const entry = this.createLogEntry(
      LogLevel.WARN,
      message,
      context,
      undefined,
      metadata,
    );
    this.logger.warn(message, context);
    this.writeToFile(LogLevel.WARN, entry);
  }

  debug(
    message: string,
    context?: string,
    metadata?: Record<string, any>,
  ): void {
    const entry = this.createLogEntry(
      LogLevel.DEBUG,
      message,
      context,
      undefined,
      metadata,
    );
    this.logger.debug(message, context);
    this.writeToFile(LogLevel.DEBUG, entry);
  }

  verbose(
    message: string,
    context?: string,
    metadata?: Record<string, any>,
  ): void {
    const entry = this.createLogEntry(
      LogLevel.VERBOSE,
      message,
      context,
      undefined,
      metadata,
    );
    this.logger.verbose(message, context);
    this.writeToFile(LogLevel.VERBOSE, entry);
  }

  // Custom logging methods for specific use cases
  logApiRequest(
    method: string,
    url: string,
    userId?: string,
    metadata?: Record<string, any>,
  ): void {
    this.log(`API Request: ${method} ${url}`, 'API', {
      method,
      url,
      userId,
      ...metadata,
    });
  }

  logApiResponse(
    method: string,
    url: string,
    statusCode: number,
    responseTime: number,
    userId?: string,
  ): void {
    this.log(
      `API Response: ${method} ${url} - ${statusCode} (${responseTime}ms)`,
      'API',
      {
        method,
        url,
        statusCode,
        responseTime,
        userId,
      },
    );
  }

  logDatabaseQuery(
    operation: string,
    collection: string,
    query: any,
    executionTime: number,
  ): void {
    this.log(
      `Database Query: ${operation} on ${collection} (${executionTime}ms)`,
      'Database',
      {
        operation,
        collection,
        query: JSON.stringify(query),
        executionTime,
      },
    );
  }

  logUserAction(
    action: string,
    userId: string,
    resource: string,
    metadata?: Record<string, any>,
  ): void {
    this.log(`User Action: ${action}`, 'UserActivity', {
      action,
      userId,
      resource,
      ...metadata,
    });
  }

  logSecurityEvent(
    event: string,
    userId?: string,
    ipAddress?: string,
    metadata?: Record<string, any>,
  ): void {
    this.warn(`Security Event: ${event}`, 'Security', {
      event,
      userId,
      ipAddress,
      ...metadata,
    });
  }

  logBusinessEvent(
    event: string,
    entityType: string,
    entityId: string,
    metadata?: Record<string, any>,
  ): void {
    this.log(`Business Event: ${event}`, 'Business', {
      event,
      entityType,
      entityId,
      ...metadata,
    });
  }

  logPerformanceMetric(
    metric: string,
    value: number,
    unit: string,
    metadata?: Record<string, any>,
  ): void {
    this.log(`Performance Metric: ${metric} = ${value}${unit}`, 'Performance', {
      metric,
      value,
      unit,
      ...metadata,
    });
  }

  // Method to get recent logs
  async getRecentLogs(
    level?: LogLevel,
    limit: number = 100,
  ): Promise<LogEntry[]> {
    try {
      const logs: LogEntry[] = [];
      const files = fs.readdirSync(this.logDir);

      for (const file of files) {
        if (level && !file.startsWith(level)) continue;

        const filePath = path.join(this.logDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.trim().split('\n').reverse();

        for (const line of lines) {
          if (logs.length >= limit) break;
          try {
            const entry = JSON.parse(line);
            logs.push(entry);
          } catch (e) {
            // Skip invalid JSON lines
          }
        }
      }

      return logs.slice(0, limit);
    } catch (error) {
      this.error('Failed to get recent logs', error.stack, 'LoggingService');
      return [];
    }
  }

  // Method to clear old logs
  async clearOldLogs(daysToKeep: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const files = fs.readdirSync(this.logDir);

      for (const file of files) {
        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);

        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          this.log(`Deleted old log file: ${file}`, 'LoggingService');
        }
      }
    } catch (error) {
      this.error('Failed to clear old logs', error.stack, 'LoggingService');
    }
  }
}
