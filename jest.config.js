module.exports = {
  collectCoverageFrom: [
    '**/src/**/*.ts'
  ],
  testTimeout: 3000,
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.ts']
};