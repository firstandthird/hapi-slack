'use strict';

const Hapi = require('hapi');
const code = require('code');
const lab = exports.lab = require('lab').script();
const hapiSlack = require('../');
const _ = require('lodash');
let server;

const options = {
  slackHook: 'https://hooks.slack.com/services/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',
  channel: '#hapi-slack-test',
  tags: ['warning', 'error', 'test']
}

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
  _.delay(done, 5000)
});
lab.test('does not post when tags do not match ', (done) => {
  try {
    server.log(['asdf', 'asdf'], 'this should not be posted to the channel');
  } catch (e) {
    console.log(e)
  } finally {
  }
  _.delay(done, 5000)
});
