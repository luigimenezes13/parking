import { beforeEach, describe, expect, it } from 'vitest';

import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { InMemoryParkingLotRepository } from '@app/tests/in-memory-repositories/in-memory-parking-lot-repository.ts';
import { CreateParkingLotUseCase } from '@app/usecases/parking-lot/create-parking-lot-usecase.ts';
import { CreateParkingLotRequest } from '@app/dto/inputs/parking-lot/create-parking-lot-input.ts';

interface Setup {
  parkingLots: InMemoryParkingLotRepository;
  usecase: CreateParkingLotUseCase;
}

async function makeSetup(): Promise<Setup> {
  const parkingLots = new InMemoryParkingLotRepository();
  const usecase = new CreateParkingLotUseCase(parkingLots);
  return { parkingLots, usecase };
}

describe('CreateParkingLotUseCase', () => {
  let setup: Setup;

  beforeEach(async () => {
    setup = await makeSetup();
  });

  it('persists a new parking lot and returns the generated identifier', async () => {
    const result = await setup.usecase.execute(
      new CreateParkingLotRequest({
        name: 'Lot A',
        address: 'R. Exemplo 100',
        totalCapacity: 50,
      }),
    );

    expect(result.parkingLotId).toBeDefined();
    const stored = await setup.parkingLots.findById(
      UniqueIdentifier.fromExisting(result.parkingLotId),
    );
    expect(stored?.name()).toBe('Lot A');
    expect(stored?.totalCapacity()).toBe(50);
    expect(stored?.isActive()).toBe(true);
  });
});
