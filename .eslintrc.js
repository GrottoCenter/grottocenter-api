module.exports = {
  env: {
    commonjs: true,
    es6: true,
    node: true,
    mocha: true,
  },
  extends: ['airbnb-base'],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  globals: {
    sails: 'readonly',
    TCave: 'readonly',
    TCaver: 'readonly',
    TComment: 'readonly',
    TDescription: 'readonly',
    TDocument: 'readonly',
    TEntrance: 'readonly',
    TFile: 'readonly',
    TFileFormat: 'readonly',
    TGeology: 'readonly',
    TGrotto: 'readonly',
    TLocation: 'readonly',
    TMassif: 'readonly',
    TName: 'readonly',
    TRigging: 'readonly',
  },
  rules: {
    'prefer-destructuring': ['error', { object: true, array: false }],
    'no-restricted-syntax': [
      'error',
      {
        selector: 'ForInStatement',
        message: 'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.',
      },
      {
        selector: 'LabeledStatement',
        message: 'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
      },
      {
        selector: 'WithStatement',
        message: '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
      },
    ],
  },
};
