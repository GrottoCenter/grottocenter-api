module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-case': [2, 'always', ['pascal-case', 'camel-case']],
    'scope-empty': [2, 'never'],
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'tech', 'refactor', 'improvement', 'chore', 'docs', 'style', 'test', 'revert']
    ]
  }
};
