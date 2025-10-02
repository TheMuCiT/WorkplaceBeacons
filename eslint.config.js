import reactNative from '@react-native/eslint-config/flat';

export default [
  ...reactNative,
  {
    ignores: ['node_modules/**', 'ios/**', 'android/**'],
    languageOptions: {
      parser: await import('@babel/eslint-parser'),
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: ['@react-native/babel-preset'],
        },
      },
    },
  },
];
