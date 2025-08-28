// cz.config.js
export default {
  // Define the commit types you allow
  types: [
    { value: 'feat', name: '✨ feat:      A new feature' },
    { value: 'fix', name: '🐛 fix:       A bug fix' },
    { value: 'docs', name: '📚 docs:      Documentation only changes' },
    {
      value: 'style',
      name: '💄 style:     Code style/formatting (no logic change)',
    },
    {
      value: 'refactor',
      name: '♻️  refactor:  Code change that neither fixes a bug nor adds a feature',
    },
    { value: 'perf', name: '⚡ perf:      Performance improvements' },
    { value: 'test', name: '🧪 test:      Adding or updating tests' },
    {
      value: 'build',
      name: '📦 build:     Build system or external dependencies',
    },
    { value: 'ci', name: '🏗️  ci:        Continuous Integration / workflows' },
    { value: 'chore', name: '🧰 chore:     Maintenance tasks' },
    { value: 'revert', name: '⏪ revert:    Revert a previous commit' },
  ],

  // Define scopes (tailored to your repo/teams)
  scopes: [
    { value: 'core', name: 'core (main logic)' },
    { value: 'ui', name: 'ui (frontend / styling)' },
    { value: 'infra', name: 'infra (CI / infra / config)' },
    { value: 'docs', name: 'docs (documentation)' },
    { value: 'deps', name: 'deps (dependencies)' },
    { value: 'product', name: 'product (roadmap features)' },
    { value: 'test', name: 'test (tests & tooling)' },
  ],

  // Allow user to enter custom scopes too
  allowCustomScopes: true,

  // Which commit types can include breaking changes
  allowBreakingChanges: ['feat', 'fix', 'refactor'],

  // Uppercase the first letter of subject line?
  upperCaseSubject: false,

  // Skip some questions if you want faster flow
  skipQuestions: [],

  // Customise prompt messages
  messages: {
    type: '🔍 Select the type of change you are committing:',
    scope: '📂 Select a scope (or press enter to skip):',
    customScope: '📂 Enter a custom scope:',
    subject: '✏️  Write a short, imperative description:\n',
    body: '📝 Provide a longer description (optional). Use | to break lines:\n',
    breaking: '💥 List any BREAKING CHANGES:\n',
    footer: '🔗 Issues this commit closes (e.g. #123):',
    confirmCommit: '✅ Are you sure you want to commit with the above message?',
  },
};
