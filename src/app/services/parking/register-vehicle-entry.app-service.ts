import { inject, injectable } from 'inversify';

import { type AppService } from '@app/shared/app-service.ts';
import { TYPES } from '@app/dto/types.ts';
import { LicensePlateVO } from '@domain/parking/value-objects/license-plate-vo.ts';
import { type DomainEventPublisher } from '@domain/shared/events/domain-event-publisher.ts';
import { ParkingSession } from '@domain/parking/aggregates/parking-session/parking-session.ts';
import { Vehicle } from '@domain/parking/entities/vehicle.ts';
import { type ParkingSessionRepository } from '@domain/parking/repositories/parking-session-repository.ts';
import { type VehicleRepository } from '@domain/parking/repositories/vehicle-repository.ts';
import { type ParkingLotResolver } from '@app/services/parking-lot-resolver.ts';
import { InvalidRecognitionPlateError } from '@app/exceptions/recognition/invalid-recognition-plate-error.ts';

export interface RegisterVehicleEntryInput {
  plate: string | null;
  entryAt: Date;
}

export interface RegisterVehicleEntryOutput {
  sessionId: string;
  status: 'created' | 'duplicate-discarded';
}

@injectable()
export class RegisterVehicleEntryAppService implements AppService<
  RegisterVehicleEntryInput,
  RegisterVehicleEntryOutput
> {
  private readonly vehicles: VehicleRepository;
  private readonly sessions: ParkingSessionRepository;
  private readonly parkingLots: ParkingLotResolver;
  private readonly publisher: DomainEventPublisher;

  constructor(
    @inject(TYPES.VehicleRepository) vehicles: VehicleRepository,
    @inject(TYPES.ParkingSessionRepository) sessions: ParkingSessionRepository,
    @inject(TYPES.ParkingLotResolver) parkingLots: ParkingLotResolver,
    @inject(TYPES.DomainEventPublisher) publisher: DomainEventPublisher,
  ) {
    this.vehicles = vehicles;
    this.sessions = sessions;
    this.parkingLots = parkingLots;
    this.publisher = publisher;
  }

  async execute(input: RegisterVehicleEntryInput): Promise<RegisterVehicleEntryOutput> {
    if (input.plate === null) {
      throw new InvalidRecognitionPlateError('vehicle.entered');
    }

    const licensePlate = LicensePlateVO.from(input.plate);
    const existingActive = await this.sessions.findActiveByPlate(licensePlate);

    if (existingActive) {
      return { sessionId: existingActive.id().value(), status: 'duplicate-discarded' };
    }

    const vehicle = await this.resolveOrCreateVehicle(licensePlate);
    await this.vehicles.save(vehicle);

    const session = ParkingSession.enter({ vehicle, entryAt: input.entryAt });
    await this.sessions.save(session);
    await this.publisher.publish(session.pullDomainEvents());

    return { sessionId: session.id().value(), status: 'created' };
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
}
