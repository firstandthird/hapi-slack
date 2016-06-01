'use strict';

const Hapi = require('hapi');
const lab = exports.lab = require('lab').script();
const hapiSlack = require('../');
let server;

const options = {
  // you will need to provide your own slack webhook here (see https://api.slack.com/incoming-webhooks)
  // your slack webhook will look something like 'https://hooks.slack.com/services/1234/5678/abcdef',
  slackHook: process.env.SLACK_WEBHOOK,
  // you can provide a name for any channel allowed by the above slack webhook:
  channel: '#hapi-slack-test',
  // you can list which tags will cause a server.log call to post to slack:
  tags: ['warning', 'error', 'success', 'test'],
  // you can specify tags that will automatically be appended to each post to slack:
  additionalTags: ['server-test.js', 'someAdditionalTag']
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
  server.log(['test'], 'this is a simple test post from hapi-slack.');
});
lab.test('posts to test slack channel with color ', (done) => {
  server.log(['error', 'test'], 'this is a simple test post from hapi-slack that should have red next to it.');
});
lab.test('lets you post an object as the message', (done) => {
  server.log(['test'], { data: 'this is an object' });
});
lab.test('warning tags will have a yellow swatch', (done) => {
  server.log(['warning'], { data: 'this is a warning object, should have yellow next to it' });
});
lab.test('error tags will have a red swatch', (done) => {
  server.log(['error'], { data: 'this is an error object, should have red next to it' });
});
lab.test('success tags will have a green swatch', (done) => {
  server.log(['success'], { data: 'this is an success object, should have green next to it' });
});
lab.test('lets you post an object with a special "message" field', (done) => {
  server.log(['error'], { message: 'this is the message that was pulled out of the object below', data: 'this is an object and should be formatted' });
});
lab.test('does not post when tags do not match ', (done) => {
server.log(['asdf', 'asdf'], 'this should not be posted to the channel');
});
lab.test('lets you call the post method manually', (done) => {
  server.methods.postMessageToSlack(['test', 'postMessageToSlack'], 'this is a test of server.method.postMessageToSlack. ');
});
lab.test('lets you call the raw post method manually', (done) => {
  server.methods.postRawDataToSlack({ text: 'this is a test of server.method.postRawDataToSlack .' });
});

lab.test('will not process tags that have "hapi-slack"', (done) => {
  server.log(['hapi-slack', 'error'], 'this should not be posted to the channel');
});
