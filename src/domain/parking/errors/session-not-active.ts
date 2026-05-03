import { DomainError } from '@domain/shared/errors/domain-error.ts';

export class SessionNotActiveError extends DomainError {
  constructor(sessionIdentifier: string) {
    super(`Parking session ${sessionIdentifier} is not active.`);
  }
}
