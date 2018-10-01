// Transpile all code following this line with babel and use 'env' (aka ES6) preset.
require('babel-register')({
  "presets": [ "es2015", "stage-0" ]
})

require("babel-core/register");
require("babel-polyfill");

global._ = require("lodash");

// Import the rest of our application.
module.exports = require('./src/process_pipe/cli.js')
