import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    include: ['**/*.integration.spec.ts'],
    setupFiles: ['./src/infra/database/__tests__/load-env.ts'],
    pool: 'forks',
    fileParallelism: false,
    sequence: {
      concurrent: false,
    },
    testTimeout: 15000,
    hookTimeout: 15000,
  },
});
