import { beforeEach, describe, expect, it } from 'vitest';

import { InMemoryParkingLotRepository } from '@app/tests/in-memory-repositories/in-memory-parking-lot-repository.ts';
import { InMemoryVehicleRepository } from '@app/tests/in-memory-repositories/in-memory-vehicle-repository.ts';
import { ListVehiclesByLotUseCase } from '@app/usecases/vehicle/list-vehicles-by-lot-usecase.ts';
import { ParkingLotNotFoundError } from '@app/exceptions/parking-lot/parking-lot-not-found-error.ts';
import { makeParkingLot } from '@domain/parking/__tests__/factories/parking-lot.factory.ts';
import { makeVehicle } from '@domain/parking/__tests__/factories/vehicle.factory.ts';

interface Setup {
  parkingLots: InMemoryParkingLotRepository;
  vehicles: InMemoryVehicleRepository;
  usecase: ListVehiclesByLotUseCase;
}

async function makeSetup(): Promise<Setup> {
  const parkingLots = new InMemoryParkingLotRepository();
  const vehicles = new InMemoryVehicleRepository();
  const usecase = new ListVehiclesByLotUseCase(vehicles, parkingLots);
  return { parkingLots, vehicles, usecase };
}

describe('ListVehiclesByLotUseCase', () => {
  let setup: Setup;

  beforeEach(async () => {
    setup = await makeSetup();
  });

  it('returns all vehicles for the parking lot', async () => {
    const lot = makeParkingLot({ name: 'Lot', address: 'a', totalCapacity: 10 });
    await setup.parkingLots.save(lot);

    await setup.vehicles.save(makeVehicle({ parkingLotId: lot.id(), licensePlate: 'AAA1A11' }));
    await setup.vehicles.save(makeVehicle({ parkingLotId: lot.id(), licensePlate: 'BBB2B22' }));

    const found = await setup.usecase.execute({ parkingLotId: lot.id().value() });

    expect(found).toHaveLength(2);
  });

  it('throws ParkingLotNotFoundError when lot does not exist', async () => {
    await expect(
      setup.usecase.execute({ parkingLotId: '00000000-0000-4000-8000-000000000000' }),
    ).rejects.toBeInstanceOf(ParkingLotNotFoundError);
  });
});
