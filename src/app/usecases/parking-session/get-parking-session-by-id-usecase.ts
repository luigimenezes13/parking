import { inject, injectable } from 'inversify';

import { type UseCase } from '@app/shared/use-case.ts';
import { TYPES } from '@app/dto/types.ts';
import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type ParkingSession } from '@domain/parking/aggregates/parking-session/parking-session.ts';
import { type ParkingSessionRepository } from '@domain/parking/repositories/parking-session-repository.ts';
import { ParkingSessionNotFoundError } from '@app/exceptions/parking-session/parking-session-not-found-error.ts';

export interface GetParkingSessionByIdInput {
  sessionId: string;
}

@injectable()
export class GetParkingSessionByIdUseCase implements UseCase<
  GetParkingSessionByIdInput,
  ParkingSession
> {
  private readonly sessions: ParkingSessionRepository;

  constructor(@inject(TYPES.ParkingSessionRepository) sessions: ParkingSessionRepository) {
    this.sessions = sessions;
  }

  async execute(input: GetParkingSessionByIdInput): Promise<ParkingSession> {
    const session = await this.sessions.findById(UniqueIdentifier.fromExisting(input.sessionId));

    if (!session) {
      throw new ParkingSessionNotFoundError(input.sessionId);
    }

    return session;
  }
}
