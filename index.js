'use strict';
const _ = require('lodash');
const Wreck = require('wreck');
const urlParse = require('url-parse');

exports.register = (server, config, next) => {
  const postMessageToSlack = (tags, data) => {
    const text = `[${_.keys(tags)}] ${data}`;
    const obj = {
      "text" : text
    };
    if (config.channel) {
      obj["channel"] = config.channel;
    }
    Wreck.request('POST', config.slackHook, {
      headers: { 'Content-type': 'application/json' },
      payload: JSON.stringify(obj)
    });
  };
  server.methods.postMessageToSlack = postMessageToSlack;
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
