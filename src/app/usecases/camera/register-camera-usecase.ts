import { inject, injectable } from 'inversify';

import { type UseCase } from '@app/shared/use-case.ts';
import { TYPES } from '@app/dto/types.ts';
import { type RegisterCameraRequest } from '@app/dto/inputs/camera/register-camera-input.ts';
import { ParkingLotNotFoundError } from '@app/exceptions/parking-lot/parking-lot-not-found-error.ts';
import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { Camera } from '@domain/parking/aggregates/camera/camera.ts';
import { CameraNameVO } from '@domain/parking/value-objects/camera-name-vo.ts';
import { StreamUrlVO } from '@domain/parking/value-objects/stream-url-vo.ts';
import { type CameraRepository } from '@domain/parking/repositories/camera-repository.ts';
import { type ParkingLotRepository } from '@domain/parking/repositories/parking-lot-repository.ts';
import { type DomainEventPublisher } from '@domain/shared/events/domain-event-publisher.ts';

export interface RegisterCameraOutput {
  cameraId: string;
}

@injectable()
export class RegisterCameraUseCase implements UseCase<RegisterCameraRequest, RegisterCameraOutput> {
  private readonly cameras: CameraRepository;
  private readonly parkingLots: ParkingLotRepository;
  private readonly publisher: DomainEventPublisher;

  constructor(
    @inject(TYPES.CameraRepository) cameras: CameraRepository,
    @inject(TYPES.ParkingLotRepository) parkingLots: ParkingLotRepository,
    @inject(TYPES.DomainEventPublisher) publisher: DomainEventPublisher,
  ) {
    this.cameras = cameras;
    this.parkingLots = parkingLots;
    this.publisher = publisher;
  }

  async execute(input: RegisterCameraRequest): Promise<RegisterCameraOutput> {
    const { parkingLotId, name, streamUrl } = input.props;

    const lotId = UniqueIdentifier.fromExisting(parkingLotId);
    const parkingLot = await this.parkingLots.findById(lotId);
    if (!parkingLot || parkingLot.isDeactivated()) {
      throw new ParkingLotNotFoundError(parkingLotId);
    }

    const camera = Camera.register({
      parkingLotId: lotId,
      name: CameraNameVO.from(name),
      streamUrl: StreamUrlVO.from(streamUrl),
      registeredAt: new Date(),
    });

    await this.cameras.save(camera);
    await this.publisher.publish(camera.pullDomainEvents());

    return { cameraId: camera.id().value() };
  }
}
