'use strict';
const _ = require('lodash');
const Wreck = require('wreck');
const urlParse = require('url-parse');

exports.register = (server, config, next) => {
  const url = urlParse(config.slackHook);
  const baseUrl = `${url.protocol}//${url.hostname}`;
  const path = url.pathname;
  const postMessageToSlack = (tags, data) => {
    const text = `[${_.keys(tags)}] ${data}`;
    Wreck.request('POST', path, {
      baseUrl : baseUrl,
      headers: { 'Content-type': 'application/json' },
      payload: JSON.stringify({ text })
    });
  };

  // event that fires whenever server.log is called:
  server.on('log', (event, tags) => {
    if (_.intersection(_.keys(tags), config.tags).length > 0) {
      postMessageToSlack(tags, event.data);
    }
  });
  next();
};

exports.register.attributes = {
  pkg: require('./package.json')
};
