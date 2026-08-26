export type AppErrorCode = 'CONFIG_ERROR' | 'AUTH_ERROR' | 'NETWORK_ERROR' | 'NOT_FOUND' | 'UNEXPECTED_ERROR';

/**
 * Mirrors nool-apps' services/errors/AppError.ts - same shape, same
 * platform-wide error taxonomy, kept as a small parallel definition here
 * rather than a shared package since these are two independent apps.
 */
export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly retryable: boolean;
  override readonly cause?: unknown;

  constructor(options: { code: AppErrorCode; message: string; retryable?: boolean; cause?: unknown }) {
    super(options.message);
    this.name = 'AppError';
    this.code = options.code;
    this.retryable = options.retryable ?? false;
    this.cause = options.cause;
  }
}

export class AuthError extends AppError {
  constructor(message: string, cause?: unknown) {
    super({ code: 'AUTH_ERROR', message, retryable: true, cause });
    this.name = 'AuthError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string, cause?: unknown) {
    super({ code: 'NETWORK_ERROR', message, retryable: true, cause });
    this.name = 'NetworkError';
  }
}

export function normalizeError(cause: unknown): AppError {
  if (cause instanceof AppError) return cause;
  if (cause instanceof Error) {
    return new AppError({ code: 'UNEXPECTED_ERROR', message: cause.message, retryable: false, cause });
  }
  return new AppError({ code: 'UNEXPECTED_ERROR', message: 'Something went wrong.', retryable: false, cause });
}
