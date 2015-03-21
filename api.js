var castv2Cli = require('castv2-client');
var inherits = require('util').inherits;
var Application = castv2Cli.Application;
var RequestResponseController = castv2Cli.RequestResponseController;
var extend = require('xtend');
var debug = require('debug')('chromecast-player:api');
var timelineHelper = require('./timelineHelper');
var noop = function() {};
var slice = Array.prototype.slice;

var Api = function(client, session) {
  var that = this;
  Application.apply(this, arguments);
  this.reqres = this.createController(RequestResponseController,
    'urn:x-cast:com.google.cast.media');

  var onMessage = function(response, broadcast) {
    if (response.type !== 'MEDIA_STATUS' ||
        !broadcast ||
        !response.status ||
        !response.status.length ||
        !response.status[0]) {
      return;
    }

    var status = response.status[0];
    that.currentSession = status;
    that.emit(status.playerState.toLowerCase(), status);
    that.emit('status', status);
  };

  var onClose = function() {
    debug('API close');
    that.reqres.removeListener('message', onMessage);
    that.reqres.removeListener('close', onClose);
    that.removeListener('close', onClose);
    if (that.client) {
      that.client.removeListener('close', onClose);
    }
    that.tlHelper.removeListener('position', onPosition);
    that.emit('closed');
  };

  this.reqres.on('message', onMessage);
  this.reqres.on('close', onClose);
  this.client.on('close', onClose);
  this.on('close', onClose);

  this.tlHelper = timelineHelper(this);

  var onPosition = function(pos) {
    that.emit('position', pos);
  };

  this.tlHelper.on('position', onPosition);
};

Api.APP_ID = 'CC1AD845';

inherits(Api, Application);

Api.prototype.getStatus = function(cb) {
  var that = this;
  this.reqres.request({ type: 'GET_STATUS' },
    function(err, response) {
      if(err) return callback(err);
      var status = response.status[0];
      that.currentSession = status;
      cb(null, status);
    }
  );
};

Api.prototype.updateStatus = function(cb) {
  var that = this;
  cb = cb || noop;
  this.getStatus(function(err, status) {
    if (status) {
      that.emit(status.playerState.toLowerCase(), status);
      that.emit('status', status);
    }
    cb(err, status);
  });
};

Api.prototype.load = function(opts, cb) {
  var options = {
    type: 'LOAD',
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

  this.reqres.request(options,
    function(err, response) {
      if(err) return cb(err);
      if(response.type === 'LOAD_FAILED') {
        return cb(new Error('Load failed'));
      }
      cb(null, response.status[0]);
    }
  );
};

Api.prototype.getCurrentSession = function(cb) {
  if (this.currentSession) return cb(null, this.currentSession);
  this.getStatus(function(err, status) {
    if (err) return cb(err);
    cb(null, status);
  });
};

Api.prototype.sessionRequest = function(data, cb) {
  var that = this;
  cb = cb || noop;
  this.getCurrentSession(function(err, session) {
    if (err) return cb(err);
    if (!session) return cb(new Error('session not found'));
    var sessionId = session.mediaSessionId;
    that.reqres.request(extend(data, { mediaSessionId: sessionId } ),
      function(err, response) {
        if(err) return cb(err);
        cb(null, response.status[0]);
      }
    );
  });
};

// create a back-reference to the platform
// needed for some api methods.
Api.prototype.setPlatform = function(platform) {
  this.platform = platform;
};

Api.prototype.play = function(cb) {
  this.sessionRequest({ type: 'PLAY' }, cb);
};

Api.prototype.pause = function(cb) {
  this.sessionRequest({ type: 'PAUSE' }, cb);
};

Api.prototype.stop = function(cb) {
  this.sessionRequest({ type: 'STOP' }, cb);
};

Api.prototype.seek = function(currentTime, cb) {
  this.sessionRequest({
    type: 'SEEK',
    currentTime: currentTime
  }, cb);
};

// volume can be a number between 0 and 1
Api.prototype.setVolume = function(volume, cb) {
  this.platform.setVolume({ level: volume }, cb || noop);
};

Api.prototype.getVolume = function(cb) {
  this.platform.getVolume(cb || noop);
};

Api.prototype.mute = function(cb) {
  this.platform.setVolume({ muted: true }, cb || noop);
};

Api.prototype.unmute = function(cb) {
  this.platform.setVolume({ muted: false }, cb || noop);
};

Api.prototype.getPosition = function() {
  return this.tlHelper.getPosition();
};

Api.prototype.getProgress = function() {
  return this.tlHelper.getProgress();
};

module.exports = Api;
