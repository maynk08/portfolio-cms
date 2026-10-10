export interface FieldError {
  field: string;
  message: string;
}

// Base class for every failed backend call; `message` is the backend's text, safe to show to the admin.
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = new.target.name;
    this.status = status;
  }
}

export class ApiUnauthorizedError extends ApiError {
  constructor(message: string) {
    super(401, message);
  }
}

export class ApiNotFoundError extends ApiError {
  constructor(message: string) {
    super(404, message);
  }
}

export class ApiConflictError extends ApiError {
  // Extra data the backend sends to explain the conflict, such as where a file is used.
  readonly details: unknown;

  constructor(message: string, details: unknown) {
    super(409, message);
    this.details = details;
  }
}

export class ApiValidationError extends ApiError {
  readonly fieldErrors: FieldError[];

  constructor(message: string, fieldErrors: FieldError[]) {
    super(422, message);
    this.fieldErrors = fieldErrors;
  }
}

export class ApiRateLimitError extends ApiError {
  readonly retryAfterSeconds: number | null;

  constructor(message: string, retryAfterSeconds: number | null) {
    super(429, message);
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

// The backend could not be reached or timed out, or it answered 503 because a dependency is not available.
export class ApiUnavailableError extends ApiError {
  // True when the backend itself answered 503 (it is up, but something it needs, such as file storage, is not set up).
  readonly isReportedByBackend: boolean;

  constructor(message = 'The server could not be reached', options?: { cause?: unknown; isReportedByBackend?: boolean }) {
    super(503, message, options);
    this.isReportedByBackend = options?.isReportedByBackend ?? false;
  }
}

// The backend answered with something that does not match the expected shape: a bug on one side, not a user error.
export class ApiResponseError extends ApiError {}
