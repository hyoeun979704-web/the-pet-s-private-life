module.exports = {
  root: true,
  env: { es2020: true, node: true },
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2020, sourceType: 'module', project: './tsconfig.json' },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  ignorePatterns: ['/lib/**/*', '/node_modules/**/*'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
};
