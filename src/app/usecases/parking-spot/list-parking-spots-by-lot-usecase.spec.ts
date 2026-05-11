import { beforeEach, describe, expect, it } from 'vitest';

import { makeParkingLot } from '@domain/parking/__tests__/factories/parking-lot.factory.ts';
import { makeParkingSpot } from '@domain/parking/__tests__/factories/parking-spot.factory.ts';
import { InMemoryParkingLotRepository } from '@app/tests/in-memory-repositories/in-memory-parking-lot-repository.ts';
import { InMemoryParkingSpotRepository } from '@app/tests/in-memory-repositories/in-memory-parking-spot-repository.ts';
import { ListParkingSpotsByLotUseCase } from '@app/usecases/parking-spot/list-parking-spots-by-lot-usecase.ts';
import { ParkingLotNotFoundError } from '@app/exceptions/parking-lot/parking-lot-not-found-error.ts';

interface Setup {
  lots: InMemoryParkingLotRepository;
  spots: InMemoryParkingSpotRepository;
  usecase: ListParkingSpotsByLotUseCase;
}

async function makeSetup(): Promise<Setup> {
  const lots = new InMemoryParkingLotRepository();
  const spots = new InMemoryParkingSpotRepository();
  const usecase = new ListParkingSpotsByLotUseCase(spots, lots);
  return { lots, spots, usecase };
}

describe('ListParkingSpotsByLotUseCase', () => {
  let setup: Setup;

  beforeEach(async () => {
    setup = await makeSetup();
  });

  it('returns all active spots for the lot', async () => {
    const lot = makeParkingLot({ name: 'Lot', address: 'addr', totalCapacity: 10 });
    await setup.lots.save(lot);

    await setup.spots.save(makeParkingSpot({ parkingLotId: lot.id(), code: 'A1', column: 1 }));
    await setup.spots.save(makeParkingSpot({ parkingLotId: lot.id(), code: 'A2', column: 2 }));

    const found = await setup.usecase.execute({ parkingLotId: lot.id().value() });

    expect(found).toHaveLength(2);
  });

  it('throws ParkingLotNotFoundError when lot is missing', async () => {
    await expect(
      setup.usecase.execute({ parkingLotId: '00000000-0000-4000-8000-000000000000' }),
    ).rejects.toBeInstanceOf(ParkingLotNotFoundError);
  });
});
