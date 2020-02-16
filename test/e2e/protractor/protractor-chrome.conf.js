exports.config = {
  specs: [
    './**/*.spec.js'
  ],
  capabilities: {
    browserName: 'chrome',
  },
  directConnect: true,
  baseUrl: 'http://localhost:9000'
};
