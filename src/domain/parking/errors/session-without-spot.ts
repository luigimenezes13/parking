import { DomainError } from '@domain/shared/errors/domain-error.ts';

export class SessionWithoutSpotError extends DomainError {
  constructor(sessionIdentifier: string) {
    super(`Parking session ${sessionIdentifier} has no spot assigned.`);
  }
}
