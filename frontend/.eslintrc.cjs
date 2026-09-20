module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: '18.2' } },
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
  overrides: [
    {
      files: ['vite.config.js', 'tailwind.config.js', 'postcss.config.js'],
      env: { browser: false, node: true },
    },
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      extends: ['plugin:@typescript-eslint/recommended'],
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      rules: {
        // TypeScript comprueba las props y las referencias de nombres.
        'react/prop-types': 'off',
        'no-undef': 'off',
      },
    },
    {
      files: [
        'src/features/dashboards/autoridad/DashboardAutoridad.tsx',
        'src/features/dashboards/decano/DashboardDecano.tsx',
        'src/features/dashboards/director/DashboardDirector.tsx',
      ],
      rules: {
        // Estos dashboards son prototipos y todavia contienen datos sin tipar.
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
    {
      files: ['src/features/auth/AuthContext.tsx'],
      rules: {
        // El contexto exporta intencionalmente el proveedor y su hook publico.
        'react-refresh/only-export-components': 'off',
      },
    },
  ],
}
