const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleDirectories: ['node_modules', '<rootDir>/'],
  moduleNameMapper: {
    '^@/pages/(.*)$': '<rootDir>/pages/$1', // ✅ Helps Jest resolve Next.js pages
    '^@/lib/(.*)$': '<rootDir>/lib/$1',     // ✅ Helps Jest resolve DB/utility functions
  },
};

module.exports = createJestConfig(customJestConfig);
