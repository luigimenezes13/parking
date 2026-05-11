import { beforeEach, describe, expect, it } from 'vitest';

import { InMemoryParkingLotRepository } from '@app/tests/in-memory-repositories/in-memory-parking-lot-repository.ts';
import { UpdateParkingLotInfoUseCase } from '@app/usecases/parking-lot/update-parking-lot-info-usecase.ts';
import { UpdateParkingLotInfoRequest } from '@app/dto/inputs/parking-lot/update-parking-lot-info-input.ts';
import { ParkingLotNotFoundError } from '@app/exceptions/parking-lot/parking-lot-not-found-error.ts';
import { makeParkingLot } from '@domain/parking/__tests__/factories/parking-lot.factory.ts';

interface Setup {
  parkingLots: InMemoryParkingLotRepository;
  usecase: UpdateParkingLotInfoUseCase;
}

async function makeSetup(): Promise<Setup> {
  const parkingLots = new InMemoryParkingLotRepository();
  const usecase = new UpdateParkingLotInfoUseCase(parkingLots);
  return { parkingLots, usecase };
}

describe('UpdateParkingLotInfoUseCase', () => {
  let setup: Setup;

  beforeEach(async () => {
    setup = await makeSetup();
  });

  it('updates name, address and totalCapacity', async () => {
    const lot = makeParkingLot({ name: 'Old', address: 'old-addr', totalCapacity: 10 });
    await setup.parkingLots.save(lot);

    const updated = await setup.usecase.execute(
      new UpdateParkingLotInfoRequest({
        parkingLotId: lot.id().value(),
        name: 'New',
        address: 'new-addr',
        totalCapacity: 50,
      }),
    );

    expect(updated.name()).toBe('New');
    expect(updated.address()).toBe('new-addr');
    expect(updated.totalCapacity()).toBe(50);
  });

  it('throws ParkingLotNotFoundError when missing', async () => {
    await expect(
      setup.usecase.execute(
        new UpdateParkingLotInfoRequest({
          parkingLotId: '00000000-0000-4000-8000-000000000000',
          name: 'X',
          address: 'x',
          totalCapacity: 1,
        }),
      ),
    ).rejects.toBeInstanceOf(ParkingLotNotFoundError);
  });
});
