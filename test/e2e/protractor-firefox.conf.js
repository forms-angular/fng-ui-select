exports.config = {
  specs: [
    './**/*.spec.js'
  ],
  capabilities: {
    browserName: 'firefox'
  },
  directConnect: true,
  baseUrl: 'http://localhost:9000'
};