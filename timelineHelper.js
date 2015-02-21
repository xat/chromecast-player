var timeline = require('time-line');
var inherits = require('util').inherits;
var debug = require('debug')('chromecast-player:timelineHelper');
var EventEmitter = require('events').EventEmitter;

var TimelineHelper = function(p) {
  if (!(this instanceof TimelineHelper)) return new TimelineHelper(p);
  this.p = p;
  this.len = 0;
  this.timelineSupported = false;
  this.tl = timeline(this.len, 250);

  var onStatus = this._updatePosition.bind(this);

  var onPosition = function(pos) {
    if (isNaN(pos.percent)) return;
    this.emit('position', pos);
  }.bind(this);

  var onPlaying = this.update.bind(this);

  var onClosed = function() {
    debug('timelineHelper closed');
    this.p.removeListener('status', onStatus);
    this.tl.removeListener('position', onPosition);
    this.p.removeListener('playing', onPlaying);
    this.p.removeListener('closed', onClosed);
    this.tl._clear();
  }.bind(this);

  this.p.on('status', onStatus);
  this.tl.on('position', onPosition);
  this.p.on('playing', onPlaying);
  this.p.on('closed', onClosed);
};

inherits(TimelineHelper, EventEmitter);

TimelineHelper.prototype._updatePosition = function(status) {
  this.tl.jumpTo(status.currentTime * 1000);
  if (status.playerState.toLowerCase() !== 'playing') {
    this.tl.pause();
  }
};

TimelineHelper.prototype._updateLength = function(err, status) {
  if (err || !status || !status.media || !status.media.duration) {
    this.timelineSupported = false;
    return;
  };

  if (this.len !== status.media.duration) {
    this.len = status.media.duration;
    this.tl.reset(this.len * 1000);
  }

  this.timelineSupported = true;
  this._updatePosition(status);
};


TimelineHelper.prototype.getPosition = function() {
  if (!this.timelineSupported) return false;
  return this.tl.getPosition();
};

TimelineHelper.prototype.getProgress = function() {
  if (!this.timelineSupported) return false;
  return this.tl.getProgress();
};

TimelineHelper.prototype.update = function() {
  this.p.getStatus(this._updateLength.bind(this));
};

module.exports = TimelineHelper;
