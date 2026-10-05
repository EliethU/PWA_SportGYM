module.exports = {
  testEnvironment: 'jsdom',
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/main.jsx',
    '!src/**/*.test.{js,jsx}',
  ],
  coverageReporters: ['text', 'html'],
  coverageDirectory: 'coverage',
  moduleNameMapper: {
    '\\.(css|scss)$': '<rootDir>/tests/styleMock.js',
    '\\.(png|jpg|jpeg|gif|svg)$': '<rootDir>/tests/fileMock.js',
  },
  testMatch: [
    '**/tests/**/*.test.{js,jsx}',
    '**/__tests__/**/*.test.{js,jsx}',
  ],
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
};
