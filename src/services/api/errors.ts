/**
 * Unified API error with context about which operation failed.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Type guard to check if an error is an ApiError.
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Extract a human-readable message from any error.
 */
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) return error.message;
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unknown error occurred';
}

/**
 * Log an API error with consistent formatting.
 * Returns the original error for re-throwing or chaining.
 */
export function logApiError(error: unknown, context?: string): void {
  const prefix = context ? `[API:${context}]` : '[API]';
  if (isApiError(error)) {
    console.error(`${prefix} ${error.operation} failed (${error.status ?? 'no status'}):`, error.message);
  } else if (error instanceof Error) {
    console.error(`${prefix}`, error.message, error.stack);
  } else {
    console.error(`${prefix}`, error);
  }
}

/**
 * Handle an API error:
 * 1. Log it consistently
 * 2. Optionally show an alert to the user
 * 3. Return the error for further handling
 */
export function handleApiError(
  error: unknown,
  options?: {
    operation?: string;
    showAlert?: boolean;
    alertMessage?: string;
  },
): void {
  logApiError(error, options?.operation);

  if (options?.showAlert) {
    const message = options.alertMessage || getErrorMessage(error);
    alert(message);
  }
}
