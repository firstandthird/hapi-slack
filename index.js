'use strict';
const _ = require('lodash');

exports.register = (server, config, next) => {
  // set config on post2slack:
  const Post2Slack = require('post2slack');
  const post2slack = new Post2Slack(config);
  // sends a payload string to slack:
  const slackPostRawMessage = (slackPayload) => {
    post2slack.post(slackPayload, (err) => {
      if (err) {
        server.log(['hapi-slack'], err);
      }
    });
  };

  const slackPostMessage = (tags, message) => {
    if (!Array.isArray(tags)) {
      const tagsToPass = [];
      Object.keys(tags).forEach((tag) => {
        if (tags[tag]) {
          tagsToPass.push(tag);
        }
      });
      tags = tagsToPass;
    }
    post2slack.postFormatted(tags, message, (err) => {
      if (err) {
        server.log(['hapi-slack'], err);
      }
    });
  };

  // event that fires whenever server.log is called:
  if (config.tags && config.tags.length > 0) {
    server.on('log', (event, tags) => {
      // don't try to log anything that has a 'hapi-slack' tag
      // (this helps to avoid circular errors)
      if (_.keys(tags).indexOf('hapi-slack') > -1) {
        return;
      }
      if (_.intersection(_.keys(tags), config.tags).length > 0) {
        slackPostMessage(tags, event.data);
      }
    });
  }
  if (config.internalErrors) {
    server.on('request-error', (request, err) => {
      slackPostMessage(['internal-error', 'error'], err.toString());
    });
  }
  // both methods are available for you to manually call:
  server.decorate('server', 'makeSlackPayload', post2slack.makeSlackPayload);
  server.decorate('server', 'slackPostMessage', slackPostMessage);
  server.decorate('server', 'slackPostRawMessage', slackPostRawMessage);
  next();
};

exports.register.attributes = {
  pkg: require('./package.json')
};
