import { DomainError } from '@domain/shared/errors/domain-error.ts';

export class EntityAlreadyDeactivatedError extends DomainError {
  constructor(entityName: string, entityIdentifier: string) {
    super(`${entityName} ${entityIdentifier} is already deactivated.`);
  }
}
