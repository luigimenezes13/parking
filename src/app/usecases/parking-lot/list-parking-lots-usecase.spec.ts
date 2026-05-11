import { beforeEach, describe, expect, it } from 'vitest';

import { ParkingLot } from '@domain/parking/entities/parking-lot.ts';
import { InMemoryParkingLotRepository } from '@app/tests/in-memory-repositories/in-memory-parking-lot-repository.ts';
import { ListParkingLotsUseCase } from '@app/usecases/parking-lot/list-parking-lots-usecase.ts';

describe('ListParkingLotsUseCase', () => {
  let parkingLots: InMemoryParkingLotRepository;
  let usecase: ListParkingLotsUseCase;

  beforeEach(() => {
    parkingLots = new InMemoryParkingLotRepository();
    usecase = new ListParkingLotsUseCase(parkingLots);
  });

  it('returns all active parking lots', async () => {
    await parkingLots.save(
      ParkingLot.register({ name: 'A', address: 'addr-a', totalCapacity: 10 }),
    );
    await parkingLots.save(
      ParkingLot.register({ name: 'B', address: 'addr-b', totalCapacity: 20 }),
    );

    const found = await usecase.execute({});

    expect(found).toHaveLength(2);
  });

  it('excludes deactivated lots from the list', async () => {
    const active = ParkingLot.register({ name: 'Active', address: 'a', totalCapacity: 10 });
    const archived = ParkingLot.register({ name: 'Archived', address: 'a', totalCapacity: 10 });
    archived.deactivate(new Date());
    await parkingLots.save(active);
    await parkingLots.save(archived);

    const found = await usecase.execute({});

    expect(found).toHaveLength(1);
    expect(found[0]?.name()).toBe('Active');
  });
});
