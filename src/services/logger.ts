// Centralized Logging Service with structured logging and correlation IDs

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: string;
  correlationId?: string;
  requestId?: string;
  duration?: number;
  metadata?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
    name?: string;
  };
  breadcrumbs?: string[];
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private isDevelopment = import.meta.env.DEV;
  private breadcrumbs: string[] = [];
  private currentCorrelationId?: string;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Generate a unique request/correlation ID for tracing
   */
  generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Set correlation ID for linking related operations
   */
  setCorrelationId(id?: string): void {
    this.currentCorrelationId = id || this.generateId();
  }

  /**
   * Get current correlation ID
   */
  getCorrelationId(): string | undefined {
    return this.currentCorrelationId;
  }

  /**
   * Add a breadcrumb for error tracking
   */
  addBreadcrumb(crumb: string): void {
    this.breadcrumbs.push(crumb);
    if (this.breadcrumbs.length > 20) {
      this.breadcrumbs.shift();
    }
  }

  /**
   * Clear breadcrumbs
   */
  clearBreadcrumbs(): void {
    this.breadcrumbs = [];
  }

  /**
   * Log a message with structured data
   */
  private log(
    level: LogLevel,
    message: string,
    context?: string,
    metadata?: Record<string, any>,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      id: this.generateId(),
      level,
      message: this.sanitizeMessage(message),
      timestamp: new Date(),
      context,
      correlationId: this.currentCorrelationId,
      metadata: this.sanitizeMetadata(metadata),
      breadcrumbs: [...this.breadcrumbs],
    };

    if (error) {
      entry.error = {
        message: error.message,
        stack: error.stack,
        name: error.name,
      };
    }

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output in development
    if (this.isDevelopment) {
      this.outputToConsole(entry);
    }

    return entry;
  }

  /**
   * Sanitize sensitive data from messages
   */
  private sanitizeMessage(message: string): string {
    return message
      .replace(/api[_-]?key[:\s]*[^\s,}]+/gi, 'api_key: [REDACTED]')
      .replace(/token[:\s]*[^\s,}]+/gi, 'token: [REDACTED]')
      .replace(/password[:\s]*[^\s,}]+/gi, 'password: [REDACTED]')
      .replace(/bearer\s+[^\s,}]+/gi, 'bearer [REDACTED]');
  }

  /**
   * Sanitize sensitive data from metadata
   */
  private sanitizeMetadata(metadata?: Record<string, any>): Record<string, any> | undefined {
    if (!metadata) return undefined;

    const sanitized = { ...metadata };
    const sensitiveKeys = ['apiKey', 'api_key', 'token', 'password', 'secret', 'authorization'];

    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Output log entry to console with formatting
   */
  private outputToConsole(entry: LogEntry): void {
    const prefix = `[${entry.level}] ${entry.context || 'App'}`;
    const style = this.getConsoleStyle(entry.level);

    console.groupCollapsed(`%c${prefix}: ${entry.message}`, style);
    console.log('Timestamp:', entry.timestamp.toISOString());
    if (entry.correlationId) console.log('Correlation ID:', entry.correlationId);
    if (entry.requestId) console.log('Request ID:', entry.requestId);
    if (entry.duration) console.log('Duration:', entry.duration + 'ms');
    if (entry.metadata) console.log('Metadata:', entry.metadata);
    if (entry.error) {
      console.error('Error:', entry.error.message);
      if (entry.error.stack) console.error('Stack:', entry.error.stack);
    }
    if (entry.breadcrumbs.length > 0) {
      console.log('Breadcrumbs:', entry.breadcrumbs);
    }
    console.groupEnd();
  }

  /**
   * Get console style for log level
   */
  private getConsoleStyle(level: LogLevel): string {
    const styles = {
      DEBUG: 'color: #6c757d; font-weight: normal',
      INFO: 'color: #0d6efd; font-weight: bold',
      WARN: 'color: #ffc107; font-weight: bold',
      ERROR: 'color: #dc3545; font-weight: bold',
    };
    return styles[level];
  }

  /**
   * Public logging methods
   */
  debug(message: string, context?: string, metadata?: Record<string, any>): void {
    this.log('DEBUG', message, context, metadata);
  }

  info(message: string, context?: string, metadata?: Record<string, any>): void {
    this.log('INFO', message, context, metadata);
  }

  warn(message: string, context?: string, metadata?: Record<string, any>): void {
    this.log('WARN', message, context, metadata);
  }

  error(message: string, context?: string, error?: Error, metadata?: Record<string, any>): void {
    this.log('ERROR', message, context, metadata, error);
  }

  /**
   * Log with timing information
   */
  logTiming(
    message: string,
    duration: number,
    context?: string,
    metadata?: Record<string, any>
  ): void {
    const entry = this.log('INFO', message, context, { ...metadata, duration });
    entry.duration = duration;
  }

  /**
   * Create a performance timer
   */
  startTimer(): { end: (message: string, context?: string) => number } {
    const startTime = performance.now();
    return {
      end: (message: string, context?: string) => {
        const duration = performance.now() - startTime;
        this.logTiming(message, duration, context);
        return duration;
      },
    };
  }

  /**
   * Get recent logs
   */
  getLogs(level?: LogLevel, limit = 100): LogEntry[] {
    let filtered = this.logs;
    if (level) {
      filtered = this.logs.filter(log => log.level === level);
    }
    return filtered.slice(-limit);
  }

  /**
   * Get logs by correlation ID
   */
  getLogsByCorrelation(correlationId: string): LogEntry[] {
    return this.logs.filter(log => log.correlationId === correlationId);
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
    this.breadcrumbs = [];
  }
}

export const logger = Logger.getInstance();
