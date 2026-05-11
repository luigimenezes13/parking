import { beforeEach, describe, expect, it } from 'vitest';

import { ParkingLot } from '@domain/parking/entities/parking-lot.ts';
import { Vehicle } from '@domain/parking/entities/vehicle.ts';
import { LicensePlateVO } from '@domain/parking/value-objects/license-plate-vo.ts';
import { InMemoryParkingLotRepository } from '@app/tests/in-memory-repositories/in-memory-parking-lot-repository.ts';
import { InMemoryVehicleRepository } from '@app/tests/in-memory-repositories/in-memory-vehicle-repository.ts';
import { ListVehiclesByLotUseCase } from '@app/usecases/vehicle/list-vehicles-by-lot-usecase.ts';
import { ParkingLotNotFoundError } from '@app/exceptions/parking-lot/parking-lot-not-found-error.ts';

describe('ListVehiclesByLotUseCase', () => {
  let parkingLots: InMemoryParkingLotRepository;
  let vehicles: InMemoryVehicleRepository;
  let usecase: ListVehiclesByLotUseCase;

  beforeEach(() => {
    parkingLots = new InMemoryParkingLotRepository();
    vehicles = new InMemoryVehicleRepository();
    usecase = new ListVehiclesByLotUseCase(vehicles, parkingLots);
  });

  it('returns all vehicles for the parking lot', async () => {
    const lot = ParkingLot.register({ name: 'Lot', address: 'a', totalCapacity: 10 });
    await parkingLots.save(lot);

    await vehicles.save(
      Vehicle.registerAnonymous({
        parkingLotId: lot.id(),
        licensePlate: LicensePlateVO.from('AAA1A11'),
      }),
    );
    await vehicles.save(
      Vehicle.registerAnonymous({
        parkingLotId: lot.id(),
        licensePlate: LicensePlateVO.from('BBB2B22'),
      }),
    );

    const found = await usecase.execute({ parkingLotId: lot.id().value() });

    expect(found).toHaveLength(2);
  });

  it('throws ParkingLotNotFoundError when lot does not exist', async () => {
    await expect(
      usecase.execute({ parkingLotId: '00000000-0000-4000-8000-000000000000' }),
    ).rejects.toBeInstanceOf(ParkingLotNotFoundError);
  });
});
