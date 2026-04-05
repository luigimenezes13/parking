import { Container } from 'inversify';

import { configureRepositories } from './Repositories.ts';
import { configureServices } from './Services.ts';
import { configureUseCases } from './Usecases.ts';
import { configureControllers } from './Controllers.ts';
import { configureMappers } from './Mappers.ts';

const container = new Container();

configureMappers(container);
configureRepositories(container);
configureServices(container);
configureUseCases(container);
configureControllers(container);

export { container };
