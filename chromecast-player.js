var castvs2Cli = require('castv2-client');
var Client = castvs2Cli.Client;
var DefaultMediaReceiver = castvs2Cli.DefaultMediaReceiver;
var mdns = require('mdns');
var mutate = require('mutate.js');
var extend = require('xtend');
var promise = require('when').promise;

var defaults = {
  autoplay: true
};

// find chromecast devices in the network and
// either return the first found or the one
// which matches deviceName.
var findDevice = function(deviceName, ttl) {
  return promise(function(resolve, reject) {
    var scanner = mdns.createBrowser(mdns.tcp('googlecast'));
    if (!ttl) ttl = 10000; // default to 10 seconds
    var timer = setTimeout(function() {
      scanner.stop();
      reject('device not found');
    }, ttl);
    scanner.on('serviceUp', function(service) {
      if (deviceName && deviceName !== service.name) return;
      resolve(service);
      scanner.stop();
      clearTimeout(timer);
    });
    scanner.start();
  });
};

// establish a connection to a chromecast device
var connectClient = function(service) {
  return promise(function(resolve, reject) {
    var client = new Client();
    client.connect(service.addresses[0], function() {
      // TODO: handle errorcase here
      resolve(client);
    });
    client.on('error', function() {
      client.close();
    });
  });
};

// launch the DefaultMediaReceiver on
// the chromecast device
var launchClient = function(client) {
  return promise(function(resolve, reject) {
    client.launch(DefaultMediaReceiver, function(err, player) {
      if (err) return reject(err);
      resolve(player);
    });
  });
};

// load a media file
var loadMedia = function(player, opts) {
  return promise(function(resolve, reject) {
    var media = {
      contentId: opts.path,
      contentType: opts.type,
      streamType: opts.streamType || 'BUFFERED'
    };
    player.load(media, { autoplay: opts.autoplay }, function(err) {
      if (err) return reject(err);
      resolve(player);
    });
  });
};

// boot the player
var player = mutate(function(opts) {
  var options = extend(defaults, opts);
  var proc = findDevice(options.device, options.ttl)
    .then(function(service) {
      return connectClient(service);
    })
    .then(function(client) {
      return launchClient(client);
    })
    .then(function(player) {
      return loadMedia(player, options)
    });

  if (!opts.cb) return proc;

  // use the callback provided
  return proc.then(function(player) {
      opts.cb(null, player);
    })
    .catch(function(err) {
      opts.cb(err);
    });
});

// create a nice API
player.method(['string'], function(done, path) {
  return done({ path: path });
});

player.method(['string', 'function'], function(done, path, cb) {
  return done({ path: path, cb: cb });
});

player.method(['string', 'object'], function(done, path, opts) {
  return done(extend({ path: path }, opts));
});

player.method(['string', 'object', 'function'], function(done, path, opts, cb) {
  return done(extend({ path: path, cb: cb }, opts));
});

player.method(['string', 'string'], function(done, path, type) {
  return done({ type: type, path: path });
});

player.method(['string', 'string', 'function'], function(done, path, type, cb) {
  return done({ type: type, path: path, cb: cb });
});

player.method(['string', 'object'], function(done, path, type, opts) {
  return done(extend({ type: type, path: path }, opts));
});

player.method(['string', 'object', 'function'], function(done, path, type, opts, cb) {
  return done(extend({ type: type, path: path, cb: cb }, opts));
});

module.exports = player.close();