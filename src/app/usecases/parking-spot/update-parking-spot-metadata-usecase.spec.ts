import { beforeEach, describe, expect, it } from 'vitest';

import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { makeParkingSpot } from '@domain/parking/__tests__/factories/parking-spot.factory.ts';
import { InMemoryParkingSpotRepository } from '@app/tests/in-memory-repositories/in-memory-parking-spot-repository.ts';
import { UpdateParkingSpotMetadataUseCase } from '@app/usecases/parking-spot/update-parking-spot-metadata-usecase.ts';
import { UpdateParkingSpotMetadataRequest } from '@app/dto/inputs/parking-spot/update-parking-spot-metadata-input.ts';
import { ParkingSpotNotFoundError } from '@app/exceptions/parking-spot/parking-spot-not-found-error.ts';
import { DuplicateSpotPositionError } from '@app/exceptions/parking-spot/duplicate-spot-position-error.ts';

describe('UpdateParkingSpotMetadataUseCase', () => {
  let spots: InMemoryParkingSpotRepository;
  let usecase: UpdateParkingSpotMetadataUseCase;

  beforeEach(() => {
    spots = new InMemoryParkingSpotRepository();
    usecase = new UpdateParkingSpotMetadataUseCase(spots);
  });

  it('updates metadata fields', async () => {
    const spot = makeParkingSpot({ code: 'A1', floor: 1, row: 1, column: 1 });
    await spots.save(spot);

    const updated = await usecase.execute(
      new UpdateParkingSpotMetadataRequest({
        parkingSpotId: spot.id().value(),
        floor: 2,
        row: 3,
        column: 4,
        isCovered: false,
        spotType: 'ELECTRIC',
      }),
    );

    expect(updated.floor()).toBe(2);
    expect(updated.row()).toBe(3);
    expect(updated.column()).toBe(4);
    expect(updated.isCovered()).toBe(false);
    expect(updated.spotType().serialize()).toBe('ELECTRIC');
  });

  it('throws ParkingSpotNotFoundError when missing', async () => {
    await expect(
      usecase.execute(
        new UpdateParkingSpotMetadataRequest({
          parkingSpotId: '00000000-0000-4000-8000-000000000000',
          floor: 1,
          row: 1,
          column: 1,
          isCovered: true,
          spotType: 'REGULAR',
        }),
      ),
    ).rejects.toBeInstanceOf(ParkingSpotNotFoundError);
  });

  it('throws DuplicateSpotPositionError when moving onto another spot', async () => {
    const lotId = UniqueIdentifier.create();
    const occupied = makeParkingSpot({
      parkingLotId: lotId,
      code: 'A1',
      floor: 1,
      row: 1,
      column: 1,
    });
    const target = makeParkingSpot({
      parkingLotId: lotId,
      code: 'B1',
      floor: 1,
      row: 1,
      column: 2,
    });
    await spots.save(occupied);
    await spots.save(target);

    await expect(
      usecase.execute(
        new UpdateParkingSpotMetadataRequest({
          parkingSpotId: target.id().value(),
          floor: 1,
          row: 1,
          column: 1,
          isCovered: true,
          spotType: 'REGULAR',
        }),
      ),
    ).rejects.toBeInstanceOf(DuplicateSpotPositionError);
  });
});
