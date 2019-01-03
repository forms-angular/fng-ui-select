exports.config = {
    specs: [
        './single-within-array.spec.js'
    ],
    capabilities: {
      browserName: 'chrome',
    },
    directConnect: true,
    baseUrl: 'http://localhost:9000'
  };