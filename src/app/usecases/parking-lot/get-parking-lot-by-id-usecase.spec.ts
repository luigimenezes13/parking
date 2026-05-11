import { beforeEach, describe, expect, it } from 'vitest';

import { InMemoryParkingLotRepository } from '@app/tests/in-memory-repositories/in-memory-parking-lot-repository.ts';
import { GetParkingLotByIdUseCase } from '@app/usecases/parking-lot/get-parking-lot-by-id-usecase.ts';
import { ParkingLotNotFoundError } from '@app/exceptions/parking-lot/parking-lot-not-found-error.ts';
import { makeParkingLot } from '@domain/parking/__tests__/factories/parking-lot.factory.ts';

interface Setup {
  parkingLots: InMemoryParkingLotRepository;
  usecase: GetParkingLotByIdUseCase;
}

async function makeSetup(): Promise<Setup> {
  const parkingLots = new InMemoryParkingLotRepository();
  const usecase = new GetParkingLotByIdUseCase(parkingLots);
  return { parkingLots, usecase };
}

describe('GetParkingLotByIdUseCase', () => {
  let setup: Setup;

  beforeEach(async () => {
    setup = await makeSetup();
  });

  it('returns the parking lot when found', async () => {
    const lot = makeParkingLot({ name: 'Lot A', address: 'addr', totalCapacity: 10 });
    await setup.parkingLots.save(lot);

    const found = await setup.usecase.execute({ parkingLotId: lot.id().value() });

    expect(found.id().equals(lot.id())).toBe(true);
  });

  it('throws ParkingLotNotFoundError when missing', async () => {
    await expect(
      setup.usecase.execute({ parkingLotId: '00000000-0000-4000-8000-000000000000' }),
    ).rejects.toBeInstanceOf(ParkingLotNotFoundError);
  });
});
