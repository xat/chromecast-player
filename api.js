var castv2Cli = require('castv2-client');
var inherits = require('util').inherits;
var Application = castv2Cli.Application;
var RequestResponseController = castv2Cli.RequestResponseController;
var extend = require('xtend');
var noop = function() {};
var slice = Array.prototype.slice;

module.exports = function(appId) {

  var Api = function(client, session) {
    var that = this;
    Application.apply(this, arguments);
    this.reqres = this.createController(RequestResponseController,
      'urn:x-cast:com.google.cast.media');

    var onMessage = function(response, broadcast) {
      if(response.type === 'MEDIA_STATUS' && broadcast) {
        var status = response.status[0];
        that.currentSession = status;
        that.emit(status.playerState.toLowerCase(), status);
        that.emit('status', status);
      }
    };

    var onClose = function() {
      that.removeListener('message', onMessage);
      that.stop();
    };

    this.reqres.on('message', onMessage);
    this.reqres.once('close', onClose);
  };

  Api.APP_ID = appId;

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

  Api.prototype.load = function(opts, cb) {
    var defaults = {
      type: 'LOAD',
      autoplay: true,
      currentTime: 0,
      activeTrackIds: []
    };
    this.reqres.request(extend(defaults, opts),
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
      var sessionId = session.mediaSessionId;
      that.reqres.request(extend(data, { mediaSessionId: sessionId } ),
        function(err, response) {
          if(err) return cb(err);
          cb(null, response.status[0]);
        }
      );
    });
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

  Api.prototype.volume = function(volume, cb) {
    this.sessionRequest({
      type: 'VOLUME',
      Volume: volume
    }, cb);
  };

  Api.prototype.seek = function(currentTime, cb) {
    this.sessionRequest({
      type: 'SEEK',
      currentTime: currentTime
    }, cb);
  };

  return Api;
};
