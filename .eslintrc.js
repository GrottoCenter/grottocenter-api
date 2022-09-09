module.exports = {
  env: {
    commonjs: true,
    es6: true,
    node: true,
    mocha: true,
  },
  extends: ['airbnb-base', 'prettier'],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  globals: {
    JDocumentLanguage: 'readonly',
    TCave: 'readonly',
    TCaver: 'readonly',
    TComment: 'readonly',
    TCountry: 'readonly',
    TDescription: 'readonly',
    TDocument: 'readonly',
    TDocumentDuplicate: 'readonly',
    TEntranceDuplicate: 'readonly',
    TEntrance: 'readonly',
    TFile: 'readonly',
    TFileFormat: 'readonly',
    TGeology: 'readonly',
    TGrotto: 'readonly',
    TGroup: 'readonly',
    THistory: 'readonly',
    TIdentifierType: 'readonly',
    TLanguage: 'readonly',
    TLicense: 'readonly',
    TLocation: 'readonly',
    TMassif: 'readonly',
    TName: 'readonly',
    TOption: 'readonly',
    TPoint: 'readonly',
    TRegion: 'readonly',
    TRigging: 'readonly',
    TRight: 'readonly',
    TSubject: 'readonly',
    TType: 'readonly',
    sails: 'readonly',
  },
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector: 'ForInStatement',
        message:
          'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.',
      },
      {
        selector: 'LabeledStatement',
        message:
          'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
      },
      {
        selector: 'WithStatement',
        message:
          '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
      },
    ],
    'prefer-destructuring': ['error', { object: true, array: false }],
  },
};
