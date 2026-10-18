module.exports = {
  testEnvironment: 'jsdom',
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/main.jsx',
    '!src/**/*.test.{js,jsx}',
    '!src/**/firebaseconfig.jsx',
    '!src/**/authcontext.jsx',
    '!src/assets/database/firebaseconfig.jsx',
  ],
  coverageReporters: ['text', 'html', 'lcov'],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
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
