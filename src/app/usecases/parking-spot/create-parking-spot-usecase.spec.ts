import { beforeEach, describe, expect, it } from 'vitest';

import { type ParkingLot } from '@domain/parking/entities/parking-lot.ts';
import { makeParkingLot } from '@domain/parking/__tests__/factories/parking-lot.factory.ts';
import { InMemoryParkingLotRepository } from '@app/tests/in-memory-repositories/in-memory-parking-lot-repository.ts';
import { InMemoryParkingSpotRepository } from '@app/tests/in-memory-repositories/in-memory-parking-spot-repository.ts';
import { CreateParkingSpotUseCase } from '@app/usecases/parking-spot/create-parking-spot-usecase.ts';
import { CreateParkingSpotRequest } from '@app/dto/inputs/parking-spot/create-parking-spot-input.ts';
import { ParkingLotNotFoundError } from '@app/exceptions/parking-lot/parking-lot-not-found-error.ts';
import { DuplicateSpotCodeError } from '@app/exceptions/parking-spot/duplicate-spot-code-error.ts';
import { DuplicateSpotPositionError } from '@app/exceptions/parking-spot/duplicate-spot-position-error.ts';

interface Setup {
  spots: InMemoryParkingSpotRepository;
  lots: InMemoryParkingLotRepository;
  usecase: CreateParkingSpotUseCase;
  lot: ParkingLot;
}

async function makeSetup(): Promise<Setup> {
  const spots = new InMemoryParkingSpotRepository();
  const lots = new InMemoryParkingLotRepository();
  const lot = makeParkingLot({ name: 'Lot', address: 'addr', totalCapacity: 10 });
  await lots.save(lot);
  const usecase = new CreateParkingSpotUseCase(spots, lots);
  return { spots, lots, usecase, lot };
}

describe('CreateParkingSpotUseCase', () => {
  let setup: Setup;

  beforeEach(async () => {
    setup = await makeSetup();
  });

  it('persists a new parking spot', async () => {
    const result = await setup.usecase.execute(
      new CreateParkingSpotRequest({
        parkingLotId: setup.lot.id().value(),
        code: 'A1',
        floor: 1,
        row: 1,
        column: 1,
        isCovered: true,
        spotType: 'REGULAR',
      }),
    );

    expect(result.parkingSpotId).toBeDefined();
    const stored = await setup.spots.findByParkingLot(setup.lot.id());
    expect(stored).toHaveLength(1);
    expect(stored[0]?.code().value()).toBe('A1');
  });

  it('throws ParkingLotNotFoundError when lot does not exist', async () => {
    await expect(
      setup.usecase.execute(
        new CreateParkingSpotRequest({
          parkingLotId: '00000000-0000-4000-8000-000000000000',
          code: 'A1',
          floor: 1,
          row: 1,
          column: 1,
          isCovered: true,
          spotType: 'REGULAR',
        }),
      ),
    ).rejects.toBeInstanceOf(ParkingLotNotFoundError);
  });

  it('throws DuplicateSpotCodeError when code already exists in lot', async () => {
    await setup.usecase.execute(
      new CreateParkingSpotRequest({
        parkingLotId: setup.lot.id().value(),
        code: 'A1',
        floor: 1,
        row: 1,
        column: 1,
        isCovered: true,
        spotType: 'REGULAR',
      }),
    );

    await expect(
      setup.usecase.execute(
        new CreateParkingSpotRequest({
          parkingLotId: setup.lot.id().value(),
          code: 'A1',
          floor: 1,
          row: 1,
          column: 2,
          isCovered: true,
          spotType: 'REGULAR',
        }),
      ),
    ).rejects.toBeInstanceOf(DuplicateSpotCodeError);
  });

  it('throws DuplicateSpotPositionError when position is already taken', async () => {
    await setup.usecase.execute(
      new CreateParkingSpotRequest({
        parkingLotId: setup.lot.id().value(),
        code: 'A1',
        floor: 1,
        row: 1,
        column: 1,
        isCovered: true,
        spotType: 'REGULAR',
      }),
    );

    await expect(
      setup.usecase.execute(
        new CreateParkingSpotRequest({
          parkingLotId: setup.lot.id().value(),
          code: 'A2',
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
