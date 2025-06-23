module.exports = {
  env: {
    browser: false,
    es6: true,
    jest: true,
    mocha: true, // Informs ESLint about Mocha's global functions like 'describe' and 'before'
  },
  extends: [
    'airbnb-base',
    'plugin:jest/all',
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  plugins: ['jest'],
  rules: {
    // --- General Rules ---
    'max-classes-per-file': 'off',
    'no-underscore-dangle': 'off',
    'no-console': 'off',
    'no-shadow': 'off',
    'no-restricted-syntax': [
      'error',
      'LabeledStatement',
      'WithStatement',
    ],

    // --- Jest Plugin Rule Overrides ---
    // These are turned OFF because they conflict with the project's use of Mocha/Chai

    'jest/valid-expect': 'off', // Turns off errors for Chai's `expect(...).to.equal(...)`
    'jest/prefer-expect-assertions': 'off', // No longer requires `expect.hasAssertions()`
    'jest/lowercase-name': 'off', // Allows `describe('Utils', ...)` with uppercase
    'jest/prefer-strict-equal': 'off', // Allows the use of `.toEqual()` or Chai's `.equal()`
  },
  overrides:[
    {
      files: ['*.js'],
      excludedFiles: 'babel.config.js',
    }
  ]
};
