'use strict';

const Hapi = require('hapi');
const code = require('code');
const lab = exports.lab = require('lab').script();
const hapiSlack = require('../');
const _ = require('lodash');
let server;

const options = {
  // you will need to provide your own slack webhook here (see https://api.slack.com/incoming-webhooks)
  // your slack webhook will look something like 'https://hooks.slack.com/services/1234/5678/abcdef',
  slackHook: process.env.SLACK_WEBHOOK,
  // you can provide a name for any channel allowed by the above slack webhook:
  channel: '#hapi-slack-test',
  // you can list which tags will cause a server.log call to post to slack:
  tags: ['warning', 'error', 'test']
};

lab.beforeEach((done) => {
  server = new Hapi.Server({});
  server.connection({ port: 8080 });
  server.register({
    register: hapiSlack,
    options
  }, () => {
    done();
  });
});

lab.afterEach((done) => {
  server.stop(() => {
    done();
  });
});
lab.test('posts to test slack channel ', (done) => {
  try {
    server.log(['warning', 'error'], 'this is a test post from hapi-slack.  Just ignore it.');
  } catch (e) {
    console.log(e)
  } finally {
  }
  _.delay(done, 2000)
});
lab.test('does not post when tags do not match ', (done) => {
  server.log(['asdf', 'asdf'], 'this should not be posted to the channel');
  _.delay(done, 2000)
});
lab.test('lets you call the post method manually', (done) => {
  server.methods.postMessageToSlack(['test', 'postMessageToSlack'], 'testing server.method.postMessageToSlack.  Just ignore this.');
  done();
});
lab.test('lets you post an object as the message', (done) => {
  server.log(['error'], { text: 'message is object' });
  _.delay(done, 2000)
});
