module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest.setup.ts'],
  roots: ['<rootDir>/src'],
  clearMocks: true
};
