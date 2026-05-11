import { beforeEach, describe, expect, it } from 'vitest';

import { SessionAlreadyFinishedError } from '@domain/parking/errors/session-already-finished.ts';
import { makeActiveSession } from '@domain/parking/__tests__/factories/parking-session.factory.ts';
import { InMemoryParkingSessionRepository } from '@app/tests/in-memory-repositories/in-memory-parking-session-repository.ts';
import { InMemoryDomainEventPublisher } from '@app/tests/factories/in-memory-domain-event-publisher.ts';
import { ForceFinishSessionUseCase } from '@app/usecases/parking-session/force-finish-session-usecase.ts';
import { ForceFinishSessionRequest } from '@app/dto/inputs/parking-session/force-finish-session-input.ts';
import { ParkingSessionNotFoundError } from '@app/exceptions/parking-session/parking-session-not-found-error.ts';

interface Setup {
  sessions: InMemoryParkingSessionRepository;
  publisher: InMemoryDomainEventPublisher;
  usecase: ForceFinishSessionUseCase;
}

async function makeSetup(): Promise<Setup> {
  const sessions = new InMemoryParkingSessionRepository();
  const publisher = new InMemoryDomainEventPublisher();
  const usecase = new ForceFinishSessionUseCase(sessions, publisher);
  return { sessions, publisher, usecase };
}

describe('ForceFinishSessionUseCase', () => {
  let setup: Setup;

  beforeEach(async () => {
    setup = await makeSetup();
  });

  it('finishes the active session and publishes events', async () => {
    const session = makeActiveSession();
    await setup.sessions.save(session);

    const finished = await setup.usecase.execute(
      new ForceFinishSessionRequest({
        sessionId: session.id().value(),
        exitAt: '2026-04-30T12:00:00Z',
      }),
    );

    expect(finished.isFinished()).toBe(true);
    expect(finished.exitAt()?.toISOString()).toBe('2026-04-30T12:00:00.000Z');
    expect(setup.publisher.published.length).toBeGreaterThan(0);
  });

  it('throws ParkingSessionNotFoundError when missing', async () => {
    await expect(
      setup.usecase.execute(
        new ForceFinishSessionRequest({ sessionId: '00000000-0000-4000-8000-000000000000' }),
      ),
    ).rejects.toBeInstanceOf(ParkingSessionNotFoundError);
  });

  it('throws SessionAlreadyFinishedError when the session has already been finished', async () => {
    const session = makeActiveSession();
    session.finish({ exitAt: new Date('2026-04-30T11:00:00Z') });
    await setup.sessions.save(session);

    await expect(
      setup.usecase.execute(new ForceFinishSessionRequest({ sessionId: session.id().value() })),
    ).rejects.toBeInstanceOf(SessionAlreadyFinishedError);
  });
});
