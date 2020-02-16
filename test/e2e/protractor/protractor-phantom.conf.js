exports.config = {
  specs: [
    './**/*.spec.js'
  ],
  capabilities: {
    browserName: 'phantomjs'
  },
  directConnect: true,
  baseUrl: 'http://localhost:9000'
};