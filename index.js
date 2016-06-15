'use strict';
const _ = require('lodash');
const Wreck = require('wreck');

exports.register = (server, config, next) => {
  // sends a payload string to slack:
  const postToSlack = (slackPayload) => {
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

  // used by postMessageToSlack to construct a nice payload:
  const makeSlackPayload = (tags, data) => {
    let slackPayload = {};
    if (_.isString(data)) {
      if (config.noTags) {
        slackPayload = {
          attachments: [{
            text: data
          }]
        };
      } else {
        slackPayload = {
          attachments: [{
            text: `${data} [${tags}] `
          }]
        };
      }
    } else if (_.isObject(data)) {
      // if it's a json object then format it so
      // it displays all nicely on slack:
      if (!data.message) {
        if (config.noTags) {
          // slack uses ``` to format text like an object:
          slackPayload = {
            attachments: [{
              text: ` \`\`\` ${JSON.stringify(data, null, '  ')} \`\`\``,
              mrkdwn_in: ['text']
            }]
          };
        } else {
          // slack uses ``` to format text like an object:
          slackPayload = {
            attachments: [{
              text: ` [${tags}] \`\`\` ${JSON.stringify(data, null, '  ')} \`\`\``,
              mrkdwn_in: ['text']
            }]
          };
        }
      // if it's a json object that has a 'message' field then pull that out:
      } else {
        const message = data.message;
        delete data.message;
        if (config.noTags) {
          slackPayload = {
            attachments: [{
              text: `${message} \`\`\` ${JSON.stringify(data, null, '  ')} \`\`\``,
              mrkdwn_in: ['text']
            }]
          };
        } else {
          slackPayload = {
            attachments: [{
              text: `${message} [${tags}] \`\`\` ${JSON.stringify(data, null, '  ')} \`\`\``,
              mrkdwn_in: ['text']
            }]
          };
        }
      }
    }
    // set any colors for special tags:
    if (tags.indexOf('success') > -1) {
      slackPayload.attachments[0].color = 'good';
    }
    if (tags.indexOf('warning') > -1) {
      slackPayload.attachments[0].color = 'warning';
    }
    if (tags.indexOf('error') > -1) {
      slackPayload.attachments[0].color = 'danger';
    }
    // set any special channel:
    if (config.channel) {
      slackPayload.channel = config.channel;
    }
    if (config.icon_url) {
      slackPayload.icon_url = config.icon_url;
    }
    if (config.username) {
      slackPayload.username = config.username;
    }
    return JSON.stringify(slackPayload);
  };

  // will format and postToSlack a server.log style message to slack:
  const postMessageToSlack = (tags, data) => {
    let slackPayload;
    // when called directly, tags is just an array:
    if (_.isArray(tags)) {
      slackPayload = makeSlackPayload(_.union(tags, config.additionalTags).join(', '), data);
    // when called as an event on server.log, tags will be an object
    // // in which they keys are the tag names:
    } else if (_.isObject(tags)) {
      slackPayload = makeSlackPayload(_.union(_.keys(tags), config.additionalTags).join(', '), data);
    }
    postToSlack(slackPayload);
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
        postMessageToSlack(tags, event.data);
      }
    });
  }
  if (config.internalErrors) {
    server.on('request-error', (request, err) => {
      postMessageToSlack(['internal-error', 'error'], err.toString());
    });
  }
  // both methods are available for you to manually call:
  server.decorate('server', 'postMessageToSlack', postMessageToSlack);
  server.decorate('server', 'postToSlack', postToSlack);
  next();
};

exports.register.attributes = {
  pkg: require('./package.json')
};
