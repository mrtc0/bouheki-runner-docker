module.exports = {
  moduleFileExtensions: ['js', 'ts'],
  testEnvironment: 'node',
  testMatch: [
    "**/__tests__/**/*.+(ts|tsx|js)",
    "**/?(*.)+(spec|test).+(ts|tsx|js)",
    "!**/__tests__/helper.ts"
  ],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest"
  },
}
