'use strict';
const _ = require('lodash');
const Logr = require('logr');
exports.register = (server, config, next) => {
  config.methods = {};
  // expose logr-slack calls directly as server methods:
  // todo: why this no work for server.slackPostMessage????
  server.expose('slackPostMessage', (tags, data) => {
    config.methods.slackPostMessage(tags, data);
  });
  server.expose('slackPostRawMessage', (tags, data) => {
    config.methods.slackPostRawMessage(tags, data);
  });
  // set up logr-slack:
  const log = new Logr({
    type: 'slack',
    plugins: {
      slack: 'logr-slack'
    },
    renderOptions: {
      slack: config
    }
  });
  // event that fires whenever server.log is called:
  if (config.tags && config.tags.length > 0) {
    server.on('log', (event, tags) => {
      // don't try to log anything that has a 'hapi-slack' tag
      // (this helps to avoid circular errors)
      if (_.keys(tags).indexOf('hapi-slack') > -1) {
        return;
      }
      if (_.intersection(_.keys(tags), config.tags).length > 0) {
        log(tags, event.data);
      }
      // optional event that fires whenever server throws internal error:
      if (config.internalError) {
        server.on('request-internal', (request, event, tags) => {
          // don't try to log anything that has a 'hapi-slack' tag
          // (this helps to avoid circular errors)
          if (_.keys(tags).indexOf('hapi-slack') > -1) {
            return;
          }
          if (_.intersection(_.keys(tags), config.tags).length > 0) {
            log(tags, event.data);
          }
          console.log(tags, event.data);
        });
      }
    });
  }
  next();
};

exports.register.attributes = {
  pkg: require('./package.json')
};
