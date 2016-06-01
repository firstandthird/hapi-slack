'use strict';
const _ = require('lodash');
const Wreck = require('wreck');

exports.register = (server, config, next) => {
  const makeSlackPayload = (tags, data) => {
    const slackPayload = {};
    if (_.isString(data)) {
      slackPayload.message = `[{$tags}, ${data}]`;
    }
  };
  const postMessageToSlack = (tags, data) => {
    // if (_.isObject(data)) {
    //   obj = JSON.stringify(data)
    // }
    // // when called directly, tags is just an array:
    // if (tags && tags.length !== undefined) {
    //   text = `[${tags}] ${data}`;
    // // when called as an event, tags will be an object
    // // in which they keys are the tag names:
    // } else {
    //   text = `[${_.keys(tags)}] ${data}`;
    // }
    // obj = {
    //   "text": text
    // };
    // if (config.channel) {
    //   obj["channel"] = config.channel;
    // }
    const slackPayload = makeSlackPayload(tags, data);
    console.log(slackPayload)
    // Wreck.request('POST', config.slackHook, {
    //   headers: { 'Content-type': 'application/json' },
    //   payload: slackPayload
    // });
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
