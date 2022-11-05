module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    testMatch: ['**/test/**/*.spec.ts'],
    collectCoverageFrom: ['./*/src/**/*.{ts,tsx,js,jsx}'],
};
