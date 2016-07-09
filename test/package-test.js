'use strict';

const Hapi = require('hapi');
const lab = exports.lab = require('lab').script();
const code = exports.code = require('code');
const hapiSlack = require('../');
let server;

lab.afterEach((done) => {
  server.stop(() => {
    done();
  });
});
lab.test('converts a basic message passed as string ', (done) => {
  server = new Hapi.Server({});
  server.connection({ port: 8080 });
  server.register({
    register: hapiSlack,
    options: {}
  }, () => {
    const packetString = server.makeSlackPayload(['test'], 'a string');
    code.expect(typeof packetString).to.equal('string');
    const packet = JSON.parse(packetString);
    code.expect(packet.attachments.length).to.equal(1);
    code.expect(packet.attachments[0].fields.length).to.equal(1);
    code.expect(packet.attachments[0].title).to.equal('a string');
    code.expect(packet.attachments[0].fields[0].title).to.equal('Tags');
    done();
  });
});
lab.test('lets you post an object as the message', (done) => {
  server = new Hapi.Server({});
  server.connection({ port: 8080 });
  server.register({
    register: hapiSlack,
    options: {}
  }, () => {
    const packet = JSON.parse(server.makeSlackPayload([], {
      data: 'this is an object'
    }));
    code.expect(packet.attachments[0].mrkdwn_in[0]).to.equal('text');
    code.expect(packet.attachments[0].text).to.equal('``` {\n  "data": "this is an object"\n} ```');
    done();
  });
});
lab.test('"error" tag will set the "danger" color option', (done) => {
  server = new Hapi.Server({});
  server.connection({ port: 8080 });
  server.register({
    register: hapiSlack,
    options: {}
  }, () => {
    const packet = JSON.parse(server.makeSlackPayload(['error'], 'some text'));
    code.expect(packet.attachments[0].color).to.equal('danger');
    done();
  });
});
lab.test('warning tags will have a yellow swatch', (done) => {
  server = new Hapi.Server({});
  server.connection({ port: 8080 });
  server.register({
    register: hapiSlack,
    options: {}
  }, () => {
    const packet = JSON.parse(server.makeSlackPayload(['warning'], 'test msg'));
    code.expect(packet.attachments[0].color).to.equal('warning');
    done();
  });
});
lab.test('"success" tags will have a "good" color', (done) => {
  server = new Hapi.Server({});
  server.connection({ port: 8080 });
  server.register({
    register: hapiSlack,
    options: {}
  }, () => {
    const packet = JSON.parse(server.makeSlackPayload(['success'], 'a string'));
    code.expect(packet.attachments[0].color).to.equal('good');
    done();
  });
});
lab.test('lets you post an object with a special "message" field', (done) => {
  server = new Hapi.Server({});
  server.connection({ port: 8080 });
  server.register({
    register: hapiSlack,
    options: {}
  }, () => {
    const packet = JSON.parse(server.makeSlackPayload([], {
      message: 'this is the message that was pulled out of the object below',
      data: 'this is an object and should be formatted'
    }));
    code.expect(packet.attachments[0].title).to.include('this is the message');
    done();
  });
});
lab.test('will use a supplied username', (done) => {
  server = new Hapi.Server({});
  server.connection({ port: 8080 });
  server.register({
    register: hapiSlack,
    options: {
      username: 'Jared'
    }
  }, () => {
    const packet = JSON.parse(server.makeSlackPayload([], 'a string'));
    code.expect(packet.username).to.equal('Jared');
    done();
  });
});
lab.test('will put a link in the title', (done) => {
  server = new Hapi.Server({});
  server.connection({ port: 8080 });
  server.register({
    register: hapiSlack,
    options: {
      additionalFields: [
        { title: 'hi', value: 'there' },
        { title: 'go', value: 'away' }
      ]
    }
  }, () => {
    const packet = JSON.parse(server.makeSlackPayload([], 'hi there'));
    code.expect(packet.attachments[0].fields.length).to.equal(3);
    code.expect(packet.attachments[0].fields[0].title).to.equal('hi');
    code.expect(packet.attachments[0].fields[1].title).to.equal('go');
    code.expect(packet.attachments[0].fields[2].title).to.equal('Tags');
    done();
  });
});
lab.test('will hide tags when indicated', (done) => {
  server = new Hapi.Server({});
  server.connection({ port: 8080 });
  server.register({
    register: hapiSlack,
    options: {
      hideTags: true
    }
  }, () => {
    const packet = JSON.parse(server.makeSlackPayload(['tags', 'more tags'], 'hi there'));
    code.expect(packet.attachments[0].fields.length).to.equal(0);
    done();
  });
});
lab.test('will post to a specific channel', (done) => {
  server = new Hapi.Server({});
  server.connection({ port: 8080 });
  server.register({
    register: hapiSlack,
    options: {
      channel: 'MTV'
    }
  }, () => {
    const packet = JSON.parse(server.makeSlackPayload([], 'a message'));
    code.expect(packet.channel).to.equal('MTV');
    done();
  });
});
lab.test('will post with a provided icon URL', (done) => {
  server = new Hapi.Server({});
  server.connection({ port: 8080 });
  server.register({
    register: hapiSlack,
    options: {
      iconURL: 'http://image.com'
    }
  }, () => {
    const packet = JSON.parse(server.makeSlackPayload([], 'a string'));
    code.expect(packet.icon_url).to.equal('http://image.com');
    done();
  });
});
