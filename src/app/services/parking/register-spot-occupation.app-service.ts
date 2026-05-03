import { inject, injectable } from 'inversify';

import { type AppService } from '@app/shared/app-service.ts';
import { TYPES } from '@app/dto/types.ts';
import { LicensePlateVO } from '@domain/parking/value-objects/license-plate-vo.ts';
import { SpotCodeVO } from '@domain/parking/value-objects/spot-code-vo.ts';
import { type DomainEventPublisher } from '@domain/shared/events/domain-event-publisher.ts';
import { ParkingSession } from '@domain/parking/aggregates/parking-session/parking-session.ts';
import { Vehicle } from '@domain/parking/entities/vehicle.ts';
import { type ParkingSessionRepository } from '@domain/parking/repositories/parking-session-repository.ts';
import { type ParkingSpotRepository } from '@domain/parking/repositories/parking-spot-repository.ts';
import { type VehicleRepository } from '@domain/parking/repositories/vehicle-repository.ts';
import { type ParkingLotResolver } from '@app/services/parking-lot-resolver.ts';
import { InvalidRecognitionPlateError } from '@app/exceptions/recognition/invalid-recognition-plate-error.ts';
import { ParkingSpotNotFoundError } from '@app/exceptions/recognition/parking-spot-not-found-error.ts';

export interface RegisterSpotOccupationInput {
  plate: string | null;
  spotCode: string;
  confidence: number;
  occupiedAt: Date;
}

export interface RegisterSpotOccupationOutput {
  sessionId: string;
  spotId: string;
}

@injectable()
export class RegisterSpotOccupationAppService implements AppService<
  RegisterSpotOccupationInput,
  RegisterSpotOccupationOutput
> {
  private readonly vehicles: VehicleRepository;
  private readonly spots: ParkingSpotRepository;
  private readonly sessions: ParkingSessionRepository;
  private readonly parkingLots: ParkingLotResolver;
  private readonly publisher: DomainEventPublisher;

  constructor(
    @inject(TYPES.VehicleRepository) vehicles: VehicleRepository,
    @inject(TYPES.ParkingSpotRepository) spots: ParkingSpotRepository,
    @inject(TYPES.ParkingSessionRepository) sessions: ParkingSessionRepository,
    @inject(TYPES.ParkingLotResolver) parkingLots: ParkingLotResolver,
    @inject(TYPES.DomainEventPublisher) publisher: DomainEventPublisher,
  ) {
    this.vehicles = vehicles;
    this.spots = spots;
    this.sessions = sessions;
    this.parkingLots = parkingLots;
    this.publisher = publisher;
  }

  async execute(input: RegisterSpotOccupationInput): Promise<RegisterSpotOccupationOutput> {
    if (input.plate === null) {
      throw new InvalidRecognitionPlateError('spot.occupied');
    }

    const licensePlate = LicensePlateVO.from(input.plate);
    const spotCode = SpotCodeVO.from(input.spotCode);
    const parkingLotId = this.parkingLots.resolveDefault();

    const spot = await this.spots.findByCode(parkingLotId, spotCode);
    if (!spot) {
      throw new ParkingSpotNotFoundError(parkingLotId.value(), input.spotCode);
    }

    const vehicle = await this.resolveOrCreateVehicle(licensePlate);
    await this.vehicles.save(vehicle);

    const session = await this.resolveOrEnterSession(licensePlate, vehicle, input.occupiedAt);
    session.assignSpot({ spot, occupiedAt: input.occupiedAt });
    await this.sessions.save(session);
    await this.publisher.publish(session.pullDomainEvents());

    return {
      sessionId: session.id().value(),
      spotId: spot.id().value(),
    };
  }

  private async resolveOrCreateVehicle(licensePlate: LicensePlateVO): Promise<Vehicle> {
    const existing = await this.vehicles.findByLicensePlate(licensePlate);
    if (existing) {
      return existing;
    }

    return Vehicle.registerAnonymous({
      parkingLotId: this.parkingLots.resolveDefault(),
      licensePlate,
    });
  }

  private async resolveOrEnterSession(
    licensePlate: LicensePlateVO,
    vehicle: Vehicle,
    occupiedAt: Date,
  ): Promise<ParkingSession> {
    const active = await this.sessions.findActiveByPlate(licensePlate);
    if (active) {
      return active;
    }

    return ParkingSession.enter({ vehicle, entryAt: occupiedAt });
  }
}
