import { DomainError } from '@domain/shared/errors/domain-error.ts';

export class InvalidSpotCodeError extends DomainError {
  constructor(rawValue: string) {
    super(`Spot code "${rawValue}" is not a valid identifier.`);
  }
}
