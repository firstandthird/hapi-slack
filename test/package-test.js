'use strict';

const Hapi = require('hapi');
const lab = exports.lab = require('lab').script();
const code = exports.code = require('code');
const hapiSlack = require('../');
const _ = require('lodash');

let server;
// code.settings.comparePrototypes = false;
lab.afterEach((done) => {
  server.stop(() => {
    done();
  });
});
lab.test('converts a basic message passed as string ', (done) => {
  const expectedPacket = {
    attachments: [{
      title: 'a string',
      fields: [{
        title: 'Tags',
        value: 'test'
      }]
    }],
  };
  server = new Hapi.Server({});
  server.connection({ });
  server.register({
    register: hapiSlack,
    options: {}
  }, () => {
    const packetString = server.makeSlackPayload(['test'], 'a string');
    code.expect(typeof packetString).to.equal('string');
    const packet = JSON.parse(packetString);
    code.expect(packet).to.equal(expectedPacket);
    done();
  });
});
lab.test('lets you post an object as the message', (done) => {
  const expectedPacket = {
    attachments: [{
      text: '``` {\n  "data": "this is an object"\n} ```',
      mrkdwn_in: ['text'],
      fields: []
    }],
  };
  server = new Hapi.Server({});
  server.connection({ });
  server.register({
    register: hapiSlack,
    options: {}
  }, () => {
    const packet = JSON.parse(server.makeSlackPayload([], {
      data: 'this is an object'
    }));
    code.expect(packet).to.equal(expectedPacket);
    done();
  });
});
lab.test('"error" tag will set the "danger" color option', (done) => {
  const expectedPacket = {
    attachments: [{
      color: 'danger',
      title: 'some text',
      fields: [{
        title: 'Tags',
        value: 'error'
      }]
    }],
  };
  server = new Hapi.Server({});
  server.connection({ });
  server.register({
    register: hapiSlack,
    options: {}
  }, () => {
    const packet = JSON.parse(server.makeSlackPayload(['error'], 'some text'));
    code.expect(packet).to.equal(expectedPacket);
    done();
  });
});
lab.test('warning tags will have a yellow swatch', (done) => {
  const expectedPacket = {
    attachments: [{
      color: 'warning',
      title: 'test msg',
      fields: [{
        title: 'Tags',
        value: 'warning'
      }]
    }],
  };
  server = new Hapi.Server({});
  server.connection({ });
  server.register({
    register: hapiSlack,
    options: {}
  }, () => {
    const packet = JSON.parse(server.makeSlackPayload(['warning'], 'test msg'));
    code.expect(packet).to.equal(expectedPacket);
    done();
  });
});
lab.test('"success" tags will have a "good" color', (done) => {
  const expectedPacket = {
    attachments: [{
      color: 'good',
      title: 'a string',
      fields: [{
        title: 'Tags',
        value: 'success'
      }]
    }],
  };
  server = new Hapi.Server({});
  server.connection({ });
  server.register({
    register: hapiSlack,
    options: {}
  }, () => {
    const packet = JSON.parse(server.makeSlackPayload(['success'], 'a string'));
    code.expect(packet).to.equal(expectedPacket);
    done();
  });
});
lab.test('lets you post an object with a special "message" field', (done) => {
  const expectedPacket = {
    attachments: [{
      title: 'this is the message that was pulled out of the object below',
      text: '``` {\n  "data": "this is an object and should be formatted"\n} ```',
      mrkdwn_in: ['text'],
      fields: []
    }],
  };
  server = new Hapi.Server({});
  server.connection({ });
  server.register({
    register: hapiSlack,
    options: {}
  }, () => {
    const packet = JSON.parse(server.makeSlackPayload([], {
      message: 'this is the message that was pulled out of the object below',
      data: 'this is an object and should be formatted'
    }));
    code.expect(packet).to.equal(expectedPacket);
    done();
  });
});
lab.test('lets you post an object without a "message" field', (done) => {
  const expectedPacket = {
    attachments: [{
      text: '``` {\n  "data": "this is an object and should be formatted"\n} ```',
      mrkdwn_in: ['text'],
      fields: []
    }],
  };
  server = new Hapi.Server({});
  server.connection({ });
  server.register({
    register: hapiSlack,
    options: {}
  }, () => {
    const packet = JSON.parse(server.makeSlackPayload([], {
      data: 'this is an object and should be formatted'
    }));
    code.expect(packet).to.equal(expectedPacket);
    done();
  });
});
lab.test('lets you set the title_link with a url field', (done) => {
  const expectedPacket = {
    attachments: [{
      fields: [],
      title: 'this is the message that was pulled out of the object below',
      title_link: 'http://example.com',
      text: '``` {\n  "data": "this is an object and should be formatted"\n} ```',
      mrkdwn_in: ['text'],
    }],
  };
  server = new Hapi.Server({});
  server.connection({ });
  server.register({
    register: hapiSlack,
    options: {}
  }, () => {
    const packet = JSON.parse(server.makeSlackPayload([], {
      message: 'this is the message that was pulled out of the object below',
      data: 'this is an object and should be formatted',
      url: 'http://example.com'
    }));
    code.expect(packet).to.equal(expectedPacket);
    done();
  });
});
lab.test('will use a supplied username', (done) => {
  const expectedPacket = {
    username: 'Jared',
    attachments: [{
      title: 'a string',
      fields: []
    }],
  };
  server = new Hapi.Server({});
  server.connection({ });
  server.register({
    register: hapiSlack,
    options: {
      username: 'Jared'
    }
  }, () => {
    const packet = JSON.parse(server.makeSlackPayload([], 'a string'));
    code.expect(packet).to.equal(expectedPacket);
    done();
  });
});
lab.test('will let you specify additional fields in options', (done) => {
  const expectedPacket = {
    attachments: [{
      fields: [
        { title: 'hi', value: 'there' },
        { title: 'go', value: 'away' }
      ],
      title: 'hi there'
    }],
  };
  server = new Hapi.Server({});
  server.connection({ });
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
    code.expect(_.isEqual(packet.attachments[0], expectedPacket.attachments[0])).to.equal(true);
    done();
  });
});
lab.test('will hide tags when indicated', (done) => {
  const expectedPacket = {
    attachments: [{
      title: 'hi there',
      fields: []
    }],
  };
  server = new Hapi.Server({});
  server.connection({ });
  server.register({
    register: hapiSlack,
    options: {
      hideTags: true
    }
  }, () => {
    const packet = JSON.parse(server.makeSlackPayload(['tags', 'more tags'], 'hi there'));
    code.expect(packet).to.equal(expectedPacket);
    done();
  });
});
lab.test('will post to a specific channel', (done) => {
  const expectedPacket = {
    attachments: [{
      title: 'a message',
      fields: []
    }],
    channel: 'MTV'
  };
  server = new Hapi.Server({});
  server.connection({ });
  server.register({
    register: hapiSlack,
    options: {
      channel: 'MTV'
    }
  }, () => {
    const packet = JSON.parse(server.makeSlackPayload([], 'a message'));
    code.expect(packet).to.equal(expectedPacket);
    done();
  });
});
lab.test('will post with a provided icon URL', (done) => {
  const expectedPacket = {
    attachments: [{
      title: 'a string',
      fields: []
    }],
    icon_url: 'http://image.com'
  };
  server = new Hapi.Server({});
  server.connection({ });
  server.register({
    register: hapiSlack,
    options: {
      iconURL: 'http://image.com'
    }
  }, () => {
    const packet = JSON.parse(server.makeSlackPayload([], 'a string'));
    code.expect(packet).to.equal(expectedPacket);
    done();
  });
});
