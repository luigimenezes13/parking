import { beforeEach, describe, expect, it } from 'vitest';

import { UniqueIdentifier } from '@domain/shared/value-objects/unique-identifier.ts';
import { InMemoryParkingLotRepository } from '@app/tests/in-memory-repositories/in-memory-parking-lot-repository.ts';
import { CreateParkingLotUseCase } from '@app/usecases/parking-lot/create-parking-lot-usecase.ts';

describe('CreateParkingLotUseCase', () => {
  let parkingLots: InMemoryParkingLotRepository;
  let usecase: CreateParkingLotUseCase;

  beforeEach(() => {
    parkingLots = new InMemoryParkingLotRepository();
    usecase = new CreateParkingLotUseCase(parkingLots);
  });

  it('persists a new parking lot and returns the generated identifier', async () => {
    const result = await usecase.execute({
      name: 'Lot A',
      address: 'R. Exemplo 100',
      totalCapacity: 50,
    });

    expect(result.parkingLotId).toBeDefined();
    const stored = await parkingLots.findById(UniqueIdentifier.fromExisting(result.parkingLotId));
    expect(stored?.name()).toBe('Lot A');
    expect(stored?.totalCapacity()).toBe(50);
    expect(stored?.isActive()).toBe(true);
  });
});
