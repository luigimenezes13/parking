import { DomainError } from '../../shared/errors/domain-error.ts';

export class InvalidParkingPeriodError extends DomainError {
  constructor(message: string) {
    super(message);
  }

  static exitBeforeEntry(entryAt: Date, exitAt: Date): InvalidParkingPeriodError {
    return new InvalidParkingPeriodError(
      `Exit timestamp ${exitAt.toISOString()} cannot be earlier than entry ${entryAt.toISOString()}.`,
    );
  }

  static periodAlreadyClosed(): InvalidParkingPeriodError {
    return new InvalidParkingPeriodError('Parking period has already been closed.');
  }
}
