'use strict';
const _ = require('lodash');
const Wreck = require('wreck');

exports.register = (server, config, next) => {
  // sends a payload string to slack:
  const slackPostRawMessage = (slackPayload) => {
    if (_.isObject(slackPayload)) {
      slackPayload = JSON.stringify(slackPayload);
    }
    Wreck.request('POST', config.slackHook, {
      headers: { 'Content-type': 'application/json' },
      payload: slackPayload
    }, (err) => {
      if (err) {
        server.log(['hapi-slack'], err);
      }
    });
  };

  // used by slackPostMessage to construct a nice payload:
  const makeSlackPayload = (tags, data) => {
    //clone because we muck with data
    data = _.cloneDeep(data);
    const attachment = {
      fields: []
    };

    if (_.isString(data)) { //if string just pass as title and be done with it
      attachment.title = data;
    } else if (_.isObject(data)) { // if object, then lets make it look good
      //if it has a message, pull that out and display as title
      if (data.message) {
        attachment.title = data.message;
        delete data.message;
      }
      if (data.url) {
        attachment.title_link = data.url;
        delete data.url;
      }
      attachment.text = `\`\`\` ${JSON.stringify(data, null, '  ')} \`\`\``;
      attachment.mrkdwn_in = ['text'];
    }
    if (config.additionalFields) {
      attachment.fields = attachment.fields.concat(config.additionalFields);
    }
    if (config.hideTags !== true && tags.length > 0) {
      attachment.fields.push({ title: 'Tags', value: tags.join(', ') });
    }
    // set any colors for special tags:
    if (tags.indexOf('success') > -1) {
      attachment.color = 'good';
    }
    if (tags.indexOf('warning') > -1) {
      attachment.color = 'warning';
    }
    if (tags.indexOf('error') > -1) {
      attachment.color = 'danger';
    }
    // set any special channel:
    const slackPayload = {
      attachments: [attachment]
    };
    if (config.channel) {
      slackPayload.channel = config.channel;
    }
    if (config.iconURL) {
      slackPayload.icon_url = config.iconURL;
    }
    if (config.username) {
      slackPayload.username = config.username;
    }
    return JSON.stringify(slackPayload);
  };

  // will format and slackPostRawMessage a server.log style message to slack:
  const slackPostMessage = (tags, data) => {
    let slackPayload;
    // when called directly, tags is just an array:
    if (_.isArray(tags)) {
      slackPayload = makeSlackPayload(_.union(tags, config.additionalTags), data);
    // when called as an event on server.log, tags will be an object
    // // in which they keys are the tag names:
    } else if (_.isObject(tags)) {
      slackPayload = makeSlackPayload(_.union(_.keys(tags), config.additionalTags), data);
    }
    slackPostRawMessage(slackPayload);
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
  server.decorate('server', 'makeSlackPayload', makeSlackPayload);
  server.decorate('server', 'slackPostMessage', slackPostMessage);
  server.decorate('server', 'slackPostRawMessage', slackPostRawMessage);
  next();
};

exports.register.attributes = {
  pkg: require('./package.json')
};
