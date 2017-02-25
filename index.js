'use strict';
const _ = require('lodash');
const Post2Slack = require('post2slack');

exports.register = (server, config, next) => {
  const post2slack = new Post2Slack(config);
  const getTagsAsArray = (tags) => {
    if (Array.isArray(tags)) {
      return tags;
    }
    return _.reduce(tags, (memo, value, tag) => {
      if (value) {
        memo.push(tag);
        return memo;
      }
      return memo;
    }, []);
  };
  const handleResponse = (err) => {
    if (err) {
      server.log(['hapi-slack', 'error'], err);
    }
  };
  // event that fires whenever server.log is called:
  if (config.tags && config.tags.length > 0) {
    server.on('log', (event, tagsAsObject) => {
      // don't try to log anything that has a 'hapi-slack' tag
      // (this helps to avoid circular errors)
      if (_.keys(tagsAsObject).indexOf('hapi-slack') > -1) {
        return;
      }
      if (_.intersection(_.keys(tagsAsObject), config.tags).length > 0) {
        post2slack.postFormatted(getTagsAsArray(tagsAsObject), event.data, handleResponse);
      }
    });
  }
  if (config.internalErrors) {
    server.on('request-error', (request, err) => {
      post2slack.postFormatted(['internal-error', 'error'], err.toString(), handleResponse);
    });
  }
  server.decorate('server', 'makeSlackPayload', post2slack.makeSlackPayload.bind(post2slack));
  server.decorate('server', 'slackPostMessage', (tags, data) => {
    post2slack.postFormatted(getTagsAsArray(tags), data, handleResponse);
  });
  server.decorate('server', 'slackPostRawMessage', (data) => {
    post2slack.post(data, handleResponse);
  });
  next();
};

exports.register.attributes = {
  pkg: require('./package.json')
};
