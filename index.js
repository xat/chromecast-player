var Client = require('castv2-client').Client;
var scanner = require('chromecast-scanner');
var ware = require('ware');
var mutate = require('mutate.js');
var inherits = require('util').inherits;
var ee = require('events').EventEmitter;
var extend = require('xtend');
var debug = require('debug')('chromecast-player');
var Promise = require('promiscuous');
var api = require('./api');
var noop = function() {};
var slice = Array.prototype.slice;

var defaults = {
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

var shutdown = function() {
  debug('shutdown');
  if (this.client && !this.clientClosed) {
    this.client.close();
    this.clientClosed = true;
  }
  if (this.player && !this.playerClosed) {
    this.player.close();
    this.playerClosed = true;
  }
  this.inst._setStatus(this, 'closed');
  this.emit('closed');
};

var player = function() {
  if (!(this instanceof player)) return new player();
  ee.call(this);
  this.mw = ware();
  this.use = this.mw.use.bind(this.mw);

  this.launch = apirize(function(opts) {
    var that = this;
    var ctx = new ee();
    ctx.mode = 'launch';
    ctx.options = opts;
    ctx.api = api;
    ctx.shutdown = shutdown;
    ctx.inst = this;
    this.mw.run(ctx, function(err, ctx) {
      ctx.options = extend(defaults, ctx.options);
      if (err) return ctx.options.cb(err);
      that._setStatus(ctx, 'loading plugins');
      that._scan(ctx)
        .then(function(ctx) { return that._connect(ctx); })
        .then(function(ctx) { return that._launch(ctx); })
        .then(function(ctx) { return that._load(ctx); })
        .then(function(ctx) { return that._status(ctx); })
        .then(function(ctx) { ctx.options.cb(null, ctx.player, ctx); },
              function(err) { ctx.options.cb(err); });
    });
  }, this);

  this.attach = apirize(function(opts) {
    var that = this;
    var ctx = new ee();
    ctx.mode = 'attach';
    ctx.options = opts;
    ctx.api = api;
    ctx.shutdown = shutdown;
    ctx.inst = this;
    that._setStatus(ctx, 'loading plugins');
    this.mw.run(ctx, function(err, opts) {
      ctx.options = extend(defaults, ctx.options);
      if (err) return options.cb(err);
      that._scan(ctx)
        .then(function(ctx) { return that._connect(ctx); })
        .then(function(ctx) { return that._find(ctx); })
        .then(function(ctx) { return that._join(ctx); })
        .then(function(ctx) { return that._status(ctx); })
        .then(function(ctx) { ctx.options.cb(null, ctx.player, ctx); },
              function(err) { ctx.options.cb(err); });
    });
  }, this);
};

inherits(player, ee);

// find chromecast devices in the network and
// either return the first found or the one
// which matches device.
player.prototype._scan = function(ctx) {
  this._setStatus(ctx, 'scanning');
  return new Promise(function(resolve, reject) {
    if (ctx.options.address) {
      ctx.address = ctx.options.address;
      return resolve(ctx);
    }
    scanner({
        name: ctx.options.device ? ctx.options.device + '.local' : null,
        ttl: ctx.options.ttl,
      },
      function(err, service) {
        if (err) return reject(err);
        ctx.address = service.data;
        resolve(ctx);
      }
    );
  });
};

// establish a connection to a chromecast device
player.prototype._connect = function(ctx) {
  this._setStatus(ctx, 'connecting');
  return new Promise(function(resolve, reject) {
    var client = new Client();
    client.connect(ctx.address, function() {
      ctx.client = client;
      resolve(ctx);
    });
    var onError = function(err) {
      debug('client error %o', err);
      client.removeListener('error', onError);
      ctx.shutdown();
    };
    var onClose = function() {
      debug('client onClose');
      client.client.removeListener('close', onClose);
      client.removeListener('error', onError);
      ctx.clientClosed = true;
    };
    client.client.on('close', onClose);
    client.on('error', onError);
  });
};

// find running app
player.prototype._find = function(ctx) {
  this._setStatus(ctx, 'finding');
  return new Promise(function(resolve, reject) {
    ctx.client.getSessions(function(err, apps) {
      if (err) return reject(err);
      if (!apps.length) return reject(new Error('app not found'));
      ctx.session = apps[0];
      resolve(ctx);
    });
  });
};

// join an existing chromecast session
player.prototype._join = function(ctx) {
  var that = this;
  this._setStatus(ctx, 'joining');
  return new Promise(function(resolve, reject) {
    ctx.client.join(ctx.session, ctx.api,
      function(err, p) {
        if (err) return reject(err);
        if (p.setPlatform) p.setPlatform(ctx.client);
        that._setStatus(ctx, 'ready');
        ctx.player = p;
        var onStatus = function(status) {
          that._setStatus(ctx, status.playerState.toLowerCase());
        };
        var onClosed = function() {
          debug('_join player onClosed');
          ctx.player.removeListener('status', onStatus);
          ctx.player.removeListener('closed', onClosed);
          ctx.playerClosed = true;
          ctx.shutdown();
        };
        ctx.player.on('status', onStatus);
        ctx.player.on('closed', onClosed);
        resolve(ctx);
      }
    );
  });
};

// fetch the current state of the player
player.prototype._status = function(ctx) {
  var that = this;
  return new Promise(function(resolve, reject) {
    ctx.player.updateStatus(function(err) {
      if (err) return reject(err);
      resolve(ctx);
    });
  });
};

// launch an application
player.prototype._launch = function(ctx) {
  var that = this;
  this._setStatus(ctx, 'launching');
  return new Promise(function(resolve, reject) {
    ctx.client.launch(ctx.api, function(err, p) {
      if (err) return reject(err);
      if (p.setPlatform) p.setPlatform(ctx.client);
      ctx.player = p;
      resolve(ctx);
    });
  });
};

// load a media file
player.prototype._load = function(ctx) {
  var that = this;
  this._setStatus(ctx, 'loading');
  return new Promise(function(resolve, reject) {
    ctx.player.load(ctx.options, function(err) {
      if (err) return reject(err);
      that._setStatus(ctx, 'ready');
      var onStatus = function(status) {
        that._setStatus(ctx, status.playerState.toLowerCase());
      };
      var onClosed = function() {
        debug('_load player onClosed');
        ctx.player.removeListener('status', onStatus);
        ctx.player.removeListener('closed', onClosed);
        ctx.playerClosed = true;
        ctx.shutdown();
      };
      ctx.player.on('status', onStatus);
      ctx.player.on('closed', onClosed);
      resolve(ctx);
    });
  });
};

player.prototype._setStatus = function(ctx, status) {
  ctx.status = status;
  ctx.emit('status', status);
};

player.api = api;

module.exports = player;
