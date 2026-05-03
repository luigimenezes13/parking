import { Container } from 'inversify';

import { configureRepositories } from '@infra/di/Repositories.ts';
import { configureServices } from '@infra/di/Services.ts';
import { configureUseCases } from '@infra/di/Usecases.ts';
import { configureAppServices } from '@infra/di/AppServices.ts';
import { configureControllers } from '@infra/di/Controllers.ts';
import { configureMappers } from '@infra/di/Mappers.ts';

const container = new Container();

configureMappers(container);
configureRepositories(container);
configureServices(container);
configureAppServices(container);
configureUseCases(container);
configureControllers(container);

export { container };
