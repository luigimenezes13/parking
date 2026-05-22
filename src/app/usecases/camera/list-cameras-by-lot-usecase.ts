import { inject, injectable } from 'inversify';

import { type UseCase } from '@app/shared/use-case.ts';
import { TYPES } from '@app/dto/types.ts';
import { ParkingLotNotFoundError } from '@app/exceptions/parking-lot/parking-lot-not-found-error.ts';
import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { type Camera } from '@domain/parking/aggregates/camera/camera.ts';
import { type CameraRepository } from '@domain/parking/repositories/camera-repository.ts';
import { type ParkingLotRepository } from '@domain/parking/repositories/parking-lot-repository.ts';

export interface ListCamerasByLotInput {
  parkingLotId: string;
}

@injectable()
export class ListCamerasByLotUseCase implements UseCase<ListCamerasByLotInput, Camera[]> {
  private readonly cameras: CameraRepository;
  private readonly parkingLots: ParkingLotRepository;

  constructor(
    @inject(TYPES.CameraRepository) cameras: CameraRepository,
    @inject(TYPES.ParkingLotRepository) parkingLots: ParkingLotRepository,
  ) {
    this.cameras = cameras;
    this.parkingLots = parkingLots;
  }

  async execute(input: ListCamerasByLotInput): Promise<Camera[]> {
    const lotId = UniqueIdentifier.fromExisting(input.parkingLotId);
    const parkingLot = await this.parkingLots.findById(lotId);
    if (!parkingLot || parkingLot.isDeactivated()) {
      throw new ParkingLotNotFoundError(input.parkingLotId);
    }
    return this.cameras.findByParkingLot(lotId);
  }
}
