var Client = require('castv2-client').Client;
var scanner = require('chromecast-scanner');
var ware = require('ware');
var mutate = require('mutate.js');
var inherits = require('util').inherits;
var ee = require('events').EventEmitter;
var extend = require('xtend');
var Promise = require('promiscuous');
var api = require('./api');
var noop = function() {};
var slice = Array.prototype.slice;

var defaults = {
  appId: 'CC1AD845', // DefaultMediaReceiver
  autoplay: true,
  ttl: 10000,
  startTime: 0,
  streamType: 'BUFFERED',
  activeTrackIds: [],
  media: {},
  cb: noop
};

var apirize = function(fn, ctx) {
  return mutate(function(opts) {
    opts = opts || {};
    if (opts._opts) {
        opts = extend(opts, opts._opts);
        delete opts._opts;
      }
      fn.call(ctx, opts);
    })
    .method(['function'], ['cb'])
    .method(['object', 'function'], ['_opts', 'cb'])
    .method(['string'], ['path'])
    .method(['string', 'function'], ['path', 'cb'])
    .method(['string', 'object'], ['path', '_opts'])
    .method(['string', 'object', 'function'], ['path', '_opts', 'cb'])
    .method(['string', 'string'], ['path', 'type'])
    .method(['string', 'string', 'function'], ['path', 'type', 'cb'])
    .method(['string', 'string', 'object'], ['path', 'type', '_opts'])
    .method(['string', 'string', 'object', 'function'], ['path', 'type', '_opts', 'cb'])
    .close();
};

var player = function() {
  if (!(this instanceof player)) return new player();
  ee.call(this);
  this.mw = ware();
  this.use = this.mw.use.bind(this.mw);

  this.launch = apirize(function(opts) {
    var that = this;
    this.mw.run(opts, this, 'launch', function(err, opts) {
      var options = extend(defaults, opts);
      if (err) return options.cb(err);
      that._scan(options)
        .then(function(address) { return that._connect(address); })
        .then(function(client) { return that._launch(client, options); })
        .then(function(p) { return that._load(p, options); })
        .then(function(p) { options.cb(null, p); },
              function(err) { options.cb(err); });
    });
  }, this);

  this.attach = apirize(function(opts) {
    var that = this;
    var client;
    this.mw.run(opts, this, 'attach', function(err, opts) {
      var options = extend(defaults, opts);
      if (err) return options.cb(err);
      that._scan(options)
        .then(function(address) { return that._connect(address); })
        .then(function(cli) { client = cli; return that._find(cli, options); })
        .then(function(session) { return that._join(client, session, options); })
        .then(function(p) { options.cb(null, p); },
              function(err) { options.cb(err); });
    });
  }, this);
};

inherits(player, ee);

// find chromecast devices in the network and
// either return the first found or the one
// which matches device.
player.prototype._scan = function(opts) {
  return new Promise(function(resolve, reject) {
    if (opts.address) return resolve(opts.address);
    scanner({ device: opts.device, ttl: opts.ttl },
      function(err, service) {
        if (err) return reject(err);
        resolve(service.address);
      }
    );
  });
};

// establish a connection to a chromecast device
player.prototype._connect = function(address) {
  return new Promise(function(resolve, reject) {
    var client = new Client();
    client.connect(address, function() {
      resolve(client);
    });
    client.on('error', function() {
      client.close();
    });
  });
};

// find running app
player.prototype._find = function(client, opts) {
  return new Promise(function(resolve, reject) {
    client.getSessions(function(err, apps) {
      if (err) return reject(err);
      if (!apps.length) return reject(new Error('app not found'));
      resolve(apps[0]);
    });
  });
};

// join an existing chromecast session
player.prototype._join = function(client, session, opts) {
  return new Promise(function(resolve, reject) {
    client.join(session, api(opts.appId),
      function(err, p) {
        if (err) return reject(err);
        resolve(p);
      }
    );
  });
};

// launch an application
player.prototype._launch = function(client, opts) {
  return new Promise(function(resolve, reject) {
    client.launch(api(opts.appId), function(err, p) {
      if (err) return reject(err);
      resolve(p);
    });
  });
};

// load a media file
player.prototype._load = function(p, opts) {
  return new Promise(function(resolve, reject) {
    var options = {
      autoplay: opts.autoplay,
      currentTime: opts.startTime,
      activeTrackIds: opts.activeTrackIds
    };
    var media = extend({
      contentId: opts.path,
      contentType: opts.type,
      streamType: opts.streamType
    }, opts.media);
    options.media = media;
    p.load(options, function(err) {
      if (err) return reject(err);
      resolve(p);
    });
  });
};

module.exports = player;
