/* eslint-env node */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'airbnb-base',
    'airbnb-typescript/base',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
  settings: {
    'import/resolver': {
      typescript: { alwaysTryTypes: true, project: './tsconfig.json' },
      node: { extensions: ['.js', '.ts'] },
    },
  },
  rules: {
    'import/prefer-default-export': 'off',
    'import/extensions': ['error', 'ignorePackages', { ts: 'never', tsx: 'never' }],
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    'class-methods-use-this': 'off',
    'max-classes-per-file': 'off',
  },
  ignorePatterns: ['dist', 'node_modules', 'android', 'ios', 'functions', '*.cjs', '*.config.ts'],
};
