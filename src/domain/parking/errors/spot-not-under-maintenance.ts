import { DomainError } from '@domain/shared/errors/domain-error.ts';

export class SpotNotUnderMaintenanceError extends DomainError {
  constructor(spotCode: string) {
    super(`Parking spot ${spotCode} is not under maintenance and cannot be released from it.`);
  }
}
