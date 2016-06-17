'use strict';

const Hapi = require('hapi');
const lab = exports.lab = require('lab').script();
const code = exports.code = require('code');
const hapiSlack = require('../');
let server;

// comment this out and set your
// SLACK_WEBHOOK env variable to a real
// slack channel to see these messages on slack.
// test cases will not pass, but you can verify the output
process.env.SLACK_WEBHOOK = 'http://localhost:8080/testSlack/';

const options = {
  // you will need to provide your own slack webhook here (see https://api.slack.com/incoming-webhooks)
  // your slack webhook will look something like 'https://hooks.slack.com/services/1234/5678/abcdef',
  slackHook: process.env.SLACK_WEBHOOK,
  // you can provide a name for any channel allowed by the above slack webhook:
  channel: '#hapi-slack-test',
  // you can list which tags will cause a server.log call to post to slack:
  tags: ['warning', 'error', 'success', 'test'],
  // you can specify tags that will automatically be appended to each post to slack:
  additionalTags: ['server-test.js', 'someAdditionalTag'],
  internalErrors: true,
  iconURL: 'http://static.squarespace.com/static/531f2c4ee4b002f5b011bf00/t/536bdcefe4b03580f8f6bb16/1399577848961/hbosiliconvalleypiedpiperoldlogo'
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
  server.route({
    method: 'POST',
    path: '/testSlack/',
    handler: (request, response) => {
      code.expect(request.payload.attachments.length).to.equal(1);
      code.expect(request.payload.attachments[0].text).to.equal('this is a simple test post from hapi-slack. [test, server-test.js, someAdditionalTag] ');
      code.expect(request.payload.channel).to.equal('#hapi-slack-test');
      response('good');
      done();
    }
  });
  server.start(() => {
    server.log(['test'], 'this is a simple test post from hapi-slack.');
  });
});

lab.test('posts to test slack channel with color ', (done) => {
  server.route({
    method: 'POST',
    path: '/testSlack/',
    handler: (request, response) => {
      code.expect(request.payload.attachments[0].color).to.equal('danger');
      response('good');
      done();
    }
  });
  server.start(() => {
    server.log(['error', 'test'], 'this is a simple test post from hapi-slack that should have red next to it.');
  });
});
lab.test('lets you post an object as the message', (done) => {
  server.route({
    method: 'POST',
    path: '/testSlack/',
    handler: (request, response) => {
      code.expect(request.payload.attachments[0].mrkdwn_in.length).to.equal(1);
      code.expect(request.payload.attachments[0].mrkdwn_in[0]).to.equal('text');
      response('good');
      done();
    }
  });
  server.start(() => {
    server.log(['test'], { data: 'this is an object' });
  });
});
lab.test('warning tags will have a yellow swatch', (done) => {
  server.route({
    method: 'POST',
    path: '/testSlack/',
    handler: (request, response) => {
      code.expect(request.payload.attachments[0].color).to.equal('warning');
      response('good');
      done();
    }
  });
  server.start(() => {
    server.log(['warning'], { data: 'this is a warning object, should have yellow next to it' });
  });
});
lab.test('error tags will have a red swatch', (done) => {
  server.route({
    method: 'POST',
    path: '/testSlack/',
    handler: (request, response) => {
      code.expect(request.payload.attachments[0].color).to.equal('danger');
      response('good');
      done();
    }
  });
  server.start(() => {
    server.log(['error'], { data: 'this is an error object, should have red next to it' });
  });
});

lab.test('success tags will have a green swatch', (done) => {
  server.route({
    method: 'POST',
    path: '/testSlack/',
    handler: (request, response) => {
      code.expect(request.payload.attachments[0].color).to.equal('good');
      response('good');
      done();
    }
  });
  server.start(() => {
    server.log(['success'], { data: 'this is an success object, should have green next to it' });
  });
});
lab.test('lets you post an object with a special "message" field', (done) => {
  server.route({
    method: 'POST',
    path: '/testSlack/',
    handler: (request, response) => {
      code.expect(request.payload.attachments[0].text).to.include('this is the message');
      response('good');
      done();
    }
  });
  server.start(() => {
    server.log(['error'], { message: 'this is the message that was pulled out of the object below', data: 'this is an object and should be formatted' });
  });
});
lab.test('does not post when tags do not match ', (done) => {
  server.route({
    method: 'POST',
    path: '/testSlack/',
    handler: (request, response) => {
      code.expect(true).to.equal(false);
      response('good');
      done();
    }
  });
  server.start(() => {
    server.log(['asdf', 'asdf'], 'this should not be posted to the channel');
  });
  setTimeout(() => {
    done();
  }, 1000);
});
lab.test('lets you call the post method manually', (done) => {
  server.route({
    method: 'POST',
    path: '/testSlack/',
    handler: (request, response) => {
      // code.expect(request.payload.attachments[0].text).to.equal('this is a test of server.slackPostMessage. ');
      code.expect(request.payload.attachments[0].text).to.equal('this is a test of server.slackPostMessage.  [test, slackPostMessage, server-test.js, someAdditionalTag] ');
      response('good');
      done();
    }
  });
  server.start(() => {
    server.slackPostMessage(['test', 'slackPostMessage'], 'this is a test of server.slackPostMessage. ');
  });
});
lab.test('lets you call the raw post method manually', (done) => {
  server.route({
    method: 'POST',
    path: '/testSlack/',
    handler: (request, response) => {
      code.expect(request.payload.text).to.equal('this is a test of server.slackPostRawMessage .');
      response('good');
      done();
    }
  });
  server.start(() => {
    server.slackPostRawMessage({ text: 'this is a test of server.slackPostRawMessage .' });
  });
});
lab.test('will not process tags that have "hapi-slack"', (done) => {
  server.route({
    method: 'POST',
    path: '/testSlack/',
    handler: (request, response) => {
      code.expect(false).to.equal(true);
      response('good');
      done();
    }
  });
  server.start(() => {
    server.log(['hapi-slack', 'error'], 'this should not be posted to the channel');
  });
  setTimeout(() => {
    done();
  }, 1000);
});
lab.test('will not process tags when noTags option is true', (done) => {
  server.stop(() => {
    options.noTags = true;
    server = new Hapi.Server({});
    server.connection({ port: 8080 });
    server.register({
      register: hapiSlack,
      options
    }, () => {
      server.route({
        method: 'POST',
        path: '/testSlack/',
        handler: (request, response) => {
          code.expect(request.payload.attachments[0].text).to.not.include('[');
          code.expect(request.payload.attachments[0].text).to.not.include(']');
          response('good');
          done();
        }
      });
      server.start(() => {
        server.log(['warning', 'error'], 'this should be posted without tags to the channel');
      });
    });
  });
});
lab.test('will use a supplied username', (done) => {
  server.stop(() => {
    delete options.noTags;
    options.username = 'Jared';
    server = new Hapi.Server({});
    server.connection({ port: 8080 });
    server.register({
      register: hapiSlack,
      options
    }, () => {
      server.route({
        method: 'POST',
        path: '/testSlack/',
        handler: (request, response) => {
          code.expect(request.payload.username).to.equal('Jared');
          response('good');
          done();
        }
      });
      server.start(() => {
        server.log(['warning', 'error'], 'this should be posted with the username Jared');
      });
    });
  });
});
lab.test('internalErrors will return an appropriate error ', (done) => {
  server.route({
    path: '/',
    method: 'GET',
    handler: () => {
      thisShouldGenerateAnInteralErrorOnSlack.youCanReferTo = 42;
    }
  });
  server.route({
    method: 'POST',
    path: '/testSlack/',
    handler: (request, response) => {
      code.expect(request.payload.attachments[0].color).to.equal('danger');
      code.expect(request.payload.attachments[0].text).to.include('thisShouldGenerateAnInteralErrorOnSlack');
      response('good');
      done();
    }
  });
  server.start(() => {
    server.inject({
      url: '/',
      method: 'GET'
    }, () => {
    });
  });
});
