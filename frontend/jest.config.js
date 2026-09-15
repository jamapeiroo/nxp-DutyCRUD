module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  roots: ['<rootDir>/src'],
  clearMocks: true,
  moduleNameMapper: {
    // Vite's import.meta.env doesn't work in Jest, use a fixed config instead
    '/config/env$': '<rootDir>/src/config/__mocks__/env.ts'
  }
};
