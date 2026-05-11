import { beforeEach, describe, expect, it } from 'vitest';

import { makeActiveSession } from '@domain/parking/__tests__/factories/parking-session.factory.ts';
import { InMemoryParkingSessionRepository } from '@app/tests/in-memory-repositories/in-memory-parking-session-repository.ts';
import { GetParkingSessionByIdUseCase } from '@app/usecases/parking-session/get-parking-session-by-id-usecase.ts';
import { ParkingSessionNotFoundError } from '@app/exceptions/parking-session/parking-session-not-found-error.ts';

interface Setup {
  sessions: InMemoryParkingSessionRepository;
  usecase: GetParkingSessionByIdUseCase;
}

async function makeSetup(): Promise<Setup> {
  const sessions = new InMemoryParkingSessionRepository();
  const usecase = new GetParkingSessionByIdUseCase(sessions);
  return { sessions, usecase };
}

describe('GetParkingSessionByIdUseCase', () => {
  let setup: Setup;

  beforeEach(async () => {
    setup = await makeSetup();
  });

  it('returns the session when found', async () => {
    const session = makeActiveSession();
    await setup.sessions.save(session);

    const found = await setup.usecase.execute({ sessionId: session.id().value() });

    expect(found.id().equals(session.id())).toBe(true);
  });

  it('throws ParkingSessionNotFoundError when missing', async () => {
    await expect(
      setup.usecase.execute({ sessionId: '00000000-0000-4000-8000-000000000000' }),
    ).rejects.toBeInstanceOf(ParkingSessionNotFoundError);
  });
});
