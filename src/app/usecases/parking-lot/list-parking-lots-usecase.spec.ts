import { beforeEach, describe, expect, it } from 'vitest';

import { InMemoryParkingLotRepository } from '@app/tests/in-memory-repositories/in-memory-parking-lot-repository.ts';
import { ListParkingLotsUseCase } from '@app/usecases/parking-lot/list-parking-lots-usecase.ts';
import { makeParkingLot } from '@domain/parking/__tests__/factories/parking-lot.factory.ts';

interface Setup {
  parkingLots: InMemoryParkingLotRepository;
  usecase: ListParkingLotsUseCase;
}

async function makeSetup(): Promise<Setup> {
  const parkingLots = new InMemoryParkingLotRepository();
  const usecase = new ListParkingLotsUseCase(parkingLots);
  return { parkingLots, usecase };
}

describe('ListParkingLotsUseCase', () => {
  let setup: Setup;

  beforeEach(async () => {
    setup = await makeSetup();
  });

  it('returns all active parking lots', async () => {
    await setup.parkingLots.save(
      makeParkingLot({ name: 'A', address: 'addr-a', totalCapacity: 10 }),
    );
    await setup.parkingLots.save(
      makeParkingLot({ name: 'B', address: 'addr-b', totalCapacity: 20 }),
    );

    const found = await setup.usecase.execute({});

    expect(found).toHaveLength(2);
  });

  it('excludes deactivated lots from the list', async () => {
    const active = makeParkingLot({ name: 'Active', address: 'a', totalCapacity: 10 });
    const archived = makeParkingLot({ name: 'Archived', address: 'a', totalCapacity: 10 });
    archived.deactivate(new Date());
    await setup.parkingLots.save(active);
    await setup.parkingLots.save(archived);

    const found = await setup.usecase.execute({});

    expect(found).toHaveLength(1);
    expect(found[0]?.name()).toBe('Active');
  });
});
