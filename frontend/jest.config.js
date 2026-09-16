module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  roots: ['<rootDir>/src'],
  clearMocks: true,
  moduleNameMapper: {
    '/config/env$': '<rootDir>/src/config/__mocks__/env.ts'
  }
};
