module.exports = {
  root: true,
  extends: ['@react-native'],
  parser: '@babel/eslint-parser',
  parserOptions: {
    requireConfigFile: false,
    babelOptions: {
      presets: ['@react-native/babel-preset'],
      plugins: [
        '@babel/plugin-syntax-typescript',
        '@babel/plugin-syntax-flow',
      ],
    },
  },
  ignorePatterns: [
    'node_modules/',
    'ios/',
    'android/',
  ],
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parser: '@babel/eslint-parser',
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: ['@react-native/babel-preset'],
          plugins: ['@babel/plugin-syntax-typescript'],
        },
      },
    },
  ],
};
