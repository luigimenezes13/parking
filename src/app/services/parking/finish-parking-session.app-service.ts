import { inject, injectable } from 'inversify';

import { type AppService } from '@app/shared/app-service.ts';
import { TYPES } from '@app/dto/types.ts';
import { LicensePlateVO } from '@domain/parking/value-objects/license-plate-vo.ts';
import { type DomainEventPublisher } from '@domain/shared/events/domain-event-publisher.ts';
import { type ParkingSessionRepository } from '@domain/parking/repositories/parking-session-repository.ts';
import { ActiveSessionNotFoundError } from '@app/exceptions/recognition/active-session-not-found-error.ts';
import { InvalidRecognitionPlateError } from '@app/exceptions/recognition/invalid-recognition-plate-error.ts';

export interface FinishParkingSessionInput {
  plate: string | null;
  exitAt: Date;
}

export interface FinishParkingSessionOutput {
  sessionId: string;
}

@injectable()
export class FinishParkingSessionAppService
  implements AppService<FinishParkingSessionInput, FinishParkingSessionOutput>
{
  private readonly sessions: ParkingSessionRepository;
  private readonly publisher: DomainEventPublisher;

  constructor(
    @inject(TYPES.ParkingSessionRepository) sessions: ParkingSessionRepository,
    @inject(TYPES.DomainEventPublisher) publisher: DomainEventPublisher,
  ) {
    this.sessions = sessions;
    this.publisher = publisher;
  }

  async execute(input: FinishParkingSessionInput): Promise<FinishParkingSessionOutput> {
    if (input.plate === null) {
      throw new InvalidRecognitionPlateError('vehicle.exited');
    }

    const licensePlate = LicensePlateVO.from(input.plate);
    const session = await this.sessions.findActiveByPlate(licensePlate);

    if (!session) {
      throw new ActiveSessionNotFoundError(`plate=${input.plate}`);
    }

    session.finish({ exitAt: input.exitAt });
    await this.sessions.save(session);
    await this.publisher.publish(session.pullDomainEvents());

    return { sessionId: session.id().value() };
  }
}
