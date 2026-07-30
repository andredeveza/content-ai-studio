export abstract class AppError extends Error {
  abstract readonly code: string;

  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  readonly code = "VALIDATION_ERROR";
}

export class NotFoundError extends AppError {
  readonly code = "NOT_FOUND";
}

export class AuthError extends AppError {
  readonly code = "AUTH_ERROR";
}

export class ConflictError extends AppError {
  readonly code = "CONFLICT";
}

export class ExternalServiceError extends AppError {
  readonly code = "EXTERNAL_SERVICE_ERROR";

  constructor(
    message: string,
    readonly service: string,
    cause?: unknown,
  ) {
    super(message, cause);
  }
}

export class RateLimitError extends AppError {
  readonly code = "RATE_LIMIT_EXCEEDED";

  constructor(
    message: string,
    readonly scope: "user" | "org" | "provider",
  ) {
    super(message);
  }
}

export class AllProvidersFailedError extends AppError {
  readonly code = "ALL_PROVIDERS_FAILED";

  constructor(
    message: string,
    readonly attempts: readonly { provider: string; error: string }[],
  ) {
    super(message);
  }
}
