var timeline = require('time-line');
var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;

var TimelineHelper = function(p, freq) {
  if (!(this instanceof TimelineHelper)) return new TimelineHelper(p);
  this.p = p;
  this.len = 0;
  this.timelineSupported = false;
  this.tl = timeline(this.len, freq || 250);
  this.p.on('status', this._updatePosition.bind(this));
  this.tl.on('position', function(pos) {
    if (isNaN(pos.percent)) return;
    this.emit('position', pos);
  }.bind(this));
  this.p.on('playing', function() {
    this.p.getStatus(this._updateLength.bind(this));
  }.bind(this));
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

module.exports = TimelineHelper;
