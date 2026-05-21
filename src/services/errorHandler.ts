import { toast } from "sonner";
import { logger } from "./logger";

export type ErrorType = 
  | 'network' 
  | 'validation' 
  | 'auth' 
  | 'server' 
  | 'conflict'
  | 'unknown';

export interface AppError {
  id: string;
  type: ErrorType;
  message: string;
  originalError?: Error;
  retryable: boolean;
  timestamp: Date;
  context?: string;
  correlationId?: string;
}

class ErrorHandler {
  private static instance: ErrorHandler;

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  handle(error: any, context?: string): AppError {
    const appError = this.classifyError(error, context);
    
    // Detailed structured logging
    logger.error(
      `Error: ${appError.message}`,
      context || 'ErrorHandler',
      appError.originalError,
      {
        errorId: appError.id,
        type: appError.type,
        retryable: appError.retryable,
        correlationId: appError.correlationId,
        stack: appError.originalError?.stack,
      }
    );

    // Add breadcrumb for error tracking
    logger.addBreadcrumb(`Error: ${appError.type} - ${context || 'Unknown'}`);

    // Show user-friendly message
    this.notifyUser(appError);

    return appError;
  }

  private classifyError(error: any, context?: string): AppError {
    const timestamp = new Date();
    const errorId = logger.generateId();
    const correlationId = logger.getCorrelationId();

    // Handle AbortError specially - not an actual error
    if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('cancelled by user'))) {
      logger.info('Operation cancelled by user', context || 'Error Handler', {
        errorMessage: error.message
      });
      return {
        id: errorId,
        type: 'unknown',
        message: 'Operation cancelled',
        retryable: false,
        timestamp,
        context,
        correlationId
      };
    }

    // Network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        id: errorId,
        type: 'network',
        message: 'Unable to connect to the server. Please check your internet connection.',
        originalError: error,
        retryable: true,
        timestamp,
        context,
        correlationId
      };
    }

    // Timeout errors
    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      return {
        id: errorId,
        type: 'network',
        message: 'Request timed out. Please try again.',
        originalError: error,
        retryable: true,
        timestamp,
        context,
        correlationId
      };
    }

    // Auth errors
    if (error.status === 401 || error.message?.includes('unauthorized')) {
      return {
        id: errorId,
        type: 'auth',
        message: 'Your session has expired. Please log in again.',
        originalError: error,
        retryable: false,
        timestamp,
        context,
        correlationId
      };
    }

    // Validation errors
    if (error.status === 400 || error.status === 422) {
      return {
        id: errorId,
        type: 'validation',
        message: error.message || 'Please check your input and try again.',
        originalError: error,
        retryable: false,
        timestamp,
        context,
        correlationId
      };
    }

    // Conflict errors
    if (error.status === 409) {
      return {
        id: errorId,
        type: 'conflict',
        message: 'This data has been modified. Please review and resolve the conflict.',
        originalError: error,
        retryable: false,
        timestamp,
        context,
        correlationId
      };
    }

    // Server errors
    if (error.status >= 500 && error.status < 600) {
      return {
        id: errorId,
        type: 'server',
        message: 'Server error. Our team has been notified. Please try again later.',
        originalError: error,
        retryable: true,
        timestamp,
        context,
        correlationId
      };
    }

    // Rate limiting
    if (error.status === 429) {
      return {
        id: errorId,
        type: 'network',
        message: 'Too many requests. Please wait a moment and try again.',
        originalError: error,
        retryable: true,
        timestamp,
        context,
        correlationId
      };
    }

    // Unknown errors
    return {
      id: errorId,
      type: 'unknown',
      message: error.message || 'An unexpected error occurred. Please try again.',
      originalError: error,
      retryable: true,
      timestamp,
      context,
      correlationId
    };
  }

  private notifyUser(error: AppError): void {
    // Don't show notifications for cancelled operations
    if (error.message === 'Operation cancelled') {
      return;
    }

    const duration = error.type === 'auth' ? undefined : 5000;

    switch (error.type) {
      case 'network':
        toast.error(error.message, {
          description: error.retryable ? 'Will retry automatically' : undefined,
          duration
        });
        break;
      
      case 'auth':
        toast.error(error.message, {
          description: 'Redirecting to login...',
          duration
        });
        break;
      
      case 'validation':
        toast.warning(error.message, { duration });
        break;
      
      case 'conflict':
        toast.warning(error.message, {
          description: 'Choose which version to keep',
          duration
        });
        break;
      
      case 'server':
        toast.error(error.message, { duration });
        break;
      
      default:
        toast.error(error.message, { duration });
    }
  }

  shouldRetry(error: AppError, attemptCount: number): boolean {
    if (!error.retryable) return false;
    if (attemptCount >= 3) return false;
    
    // Don't retry auth errors
    if (error.type === 'auth') return false;
    
    return true;
  }

  getRetryDelay(attemptCount: number): number {
    // Exponential backoff: 1s, 2s, 4s
    return Math.min(1000 * Math.pow(2, attemptCount), 10000);
  }
}

export const errorHandler = ErrorHandler.getInstance();
