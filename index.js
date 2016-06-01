'use strict';
const _ = require('lodash');
const Wreck = require('wreck');

exports.register = (server, config, next) => {
  const postMessageToSlack = (tags, data) => {
    let text;
    // when called directly, tags will be an array:
    if (tags && tags.length !== undefined) {
      text = `[${tags}] ${data}`;
    } else {
      text = `[${_.keys(tags)}] ${data}`;
    }
    const obj = {
      "text": text
    };
    if (config.channel) {
      obj["channel"] = config.channel;
    }
    console.log('sending:')
    console.log(obj)
    Wreck.request('POST', config.slackHook, {
      headers: { 'Content-type': 'application/json' },
      payload: JSON.stringify(obj)
    });
  };
  // event that fires whenever server.log is called:
  if (config.tags && config.tags.length > 0) {
    server.on('log', (event, tags) => {
      if (_.intersection(_.keys(tags), config.tags).length > 0) {
        postMessageToSlack(tags, event.data);
      }
    });
  }
  server.methods.postMessageToSlack = postMessageToSlack;
  next();
};

exports.register.attributes = {
  pkg: require('./package.json')
};
