import { beforeEach, describe, expect, it } from 'vitest';

import { ParkingLot } from '@domain/parking/entities/parking-lot.ts';
import { InMemoryParkingLotRepository } from '@app/tests/in-memory-repositories/in-memory-parking-lot-repository.ts';
import { UpdateParkingLotInfoUseCase } from '@app/usecases/parking-lot/update-parking-lot-info-usecase.ts';
import { ParkingLotNotFoundError } from '@app/exceptions/parking-lot/parking-lot-not-found-error.ts';

describe('UpdateParkingLotInfoUseCase', () => {
  let parkingLots: InMemoryParkingLotRepository;
  let usecase: UpdateParkingLotInfoUseCase;

  beforeEach(() => {
    parkingLots = new InMemoryParkingLotRepository();
    usecase = new UpdateParkingLotInfoUseCase(parkingLots);
  });

  it('updates name, address and totalCapacity', async () => {
    const lot = ParkingLot.register({ name: 'Old', address: 'old-addr', totalCapacity: 10 });
    await parkingLots.save(lot);

    const updated = await usecase.execute({
      parkingLotId: lot.id().value(),
      name: 'New',
      address: 'new-addr',
      totalCapacity: 50,
    });

    expect(updated.name()).toBe('New');
    expect(updated.address()).toBe('new-addr');
    expect(updated.totalCapacity()).toBe(50);
  });

  it('throws ParkingLotNotFoundError when missing', async () => {
    await expect(
      usecase.execute({
        parkingLotId: '00000000-0000-4000-8000-000000000000',
        name: 'X',
        address: 'x',
        totalCapacity: 1,
      }),
    ).rejects.toBeInstanceOf(ParkingLotNotFoundError);
  });
});
