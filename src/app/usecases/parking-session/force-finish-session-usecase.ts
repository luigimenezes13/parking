import { inject, injectable } from 'inversify';

import { type UseCase } from '@app/shared/use-case.ts';
import { TYPES } from '@app/dto/types.ts';
import { type ForceFinishSessionRequest } from '@app/dto/inputs/parking-session/force-finish-session-input.ts';
import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type ParkingSession } from '@domain/parking/aggregates/parking-session/parking-session.ts';
import { type ParkingSessionRepository } from '@domain/parking/repositories/parking-session-repository.ts';
import { type DomainEventPublisher } from '@domain/shared/events/domain-event-publisher.ts';
import { ParkingSessionNotFoundError } from '@app/exceptions/parking-session/parking-session-not-found-error.ts';

@injectable()
export class ForceFinishSessionUseCase implements UseCase<
  ForceFinishSessionRequest,
  ParkingSession
> {
  private readonly sessions: ParkingSessionRepository;
  private readonly publisher: DomainEventPublisher;

  constructor(
    @inject(TYPES.ParkingSessionRepository) sessions: ParkingSessionRepository,
    @inject(TYPES.DomainEventPublisher) publisher: DomainEventPublisher,
  ) {
    this.sessions = sessions;
    this.publisher = publisher;
  }

  async execute(input: ForceFinishSessionRequest): Promise<ParkingSession> {
    const { sessionId, exitAt } = input.props;

    const session = await this.sessions.findById(UniqueIdentifier.fromExisting(sessionId));

    if (!session) {
      throw new ParkingSessionNotFoundError(sessionId);
    }

    session.finish({ exitAt: exitAt ? new Date(exitAt) : new Date() });
    await this.sessions.save(session);
    await this.publisher.publish(session.pullDomainEvents());

    return session;
  }
}
