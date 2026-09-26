/**
 * Financial domain error definitions.
 */

export class DomainValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "DomainValidationError";
  }
}

export class InvalidMoneyInputError extends DomainValidationError {
  constructor(message) {
    super(message);
    this.name = "InvalidMoneyInputError";
  }
}

export class UnsafeMoneyIntegerError extends DomainValidationError {
  constructor() {
    super("Money amount must be a safe integer.");
    this.name = "UnsafeMoneyIntegerError";
  }
}

export class CurrencyMismatchError extends DomainValidationError {
  constructor(left, right) {
    super(`Currency mismatch: ${left} and ${right}.`);
    this.name = "CurrencyMismatchError";
  }
}

export class InvalidTransferError extends DomainValidationError {
  constructor(message) {
    super(message);
    this.name = "InvalidTransferError";
  }
}
