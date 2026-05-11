import { inject, injectable } from 'inversify';

import { type UseCase } from '@app/shared/use-case.ts';
import { TYPES } from '@app/dto/types.ts';
import { type ForcePlateSessionRequest } from '@app/dto/inputs/parking-session/force-plate-session-input.ts';
import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { LicensePlateVO } from '@domain/parking/value-objects/license-plate-vo.ts';
import { Vehicle } from '@domain/parking/entities/vehicle.ts';
import { type ParkingSession } from '@domain/parking/aggregates/parking-session/parking-session.ts';
import { type ParkingSessionRepository } from '@domain/parking/repositories/parking-session-repository.ts';
import { type VehicleRepository } from '@domain/parking/repositories/vehicle-repository.ts';
import { type DomainEventPublisher } from '@domain/shared/events/domain-event-publisher.ts';
import { ParkingSessionNotFoundError } from '@app/exceptions/parking-session/parking-session-not-found-error.ts';

@injectable()
export class ForcePlateSessionUseCase implements UseCase<ForcePlateSessionRequest, ParkingSession> {
  private readonly sessions: ParkingSessionRepository;
  private readonly vehicles: VehicleRepository;
  private readonly publisher: DomainEventPublisher;

  constructor(
    @inject(TYPES.ParkingSessionRepository) sessions: ParkingSessionRepository,
    @inject(TYPES.VehicleRepository) vehicles: VehicleRepository,
    @inject(TYPES.DomainEventPublisher) publisher: DomainEventPublisher,
  ) {
    this.sessions = sessions;
    this.vehicles = vehicles;
    this.publisher = publisher;
  }

  async execute(input: ForcePlateSessionRequest): Promise<ParkingSession> {
    const { sessionId, plate } = input.props;

    const session = await this.sessions.findById(UniqueIdentifier.fromExisting(sessionId));

    if (!session) {
      throw new ParkingSessionNotFoundError(sessionId);
    }

    const licensePlate = LicensePlateVO.from(plate);
    const vehicle = await this.resolveOrCreateVehicle(licensePlate, session.parkingLotId());
    await this.vehicles.save(vehicle);

    session.assignVehicle({ vehicle });
    await this.sessions.save(session);
    await this.publisher.publish(session.pullDomainEvents());

    return session;
  }

  private async resolveOrCreateVehicle(
    licensePlate: LicensePlateVO,
    parkingLotId: UniqueIdentifier,
  ): Promise<Vehicle> {
    const existing = await this.vehicles.findByLicensePlate(licensePlate);
    if (existing) {
      return existing;
    }

    return Vehicle.registerAnonymous({ parkingLotId, licensePlate });
  }
}
