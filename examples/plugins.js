var player = require('../')();

// this sample plugin sets the path to a default
// movie if no path was specified.
var defaultPathPlugin = function(opts, player, type, next) {
  if (type !== 'launch') return next();
  if (!opts.path) opts.path = 'http://commondatastorage.googleapis.com/gtv-videos-bucket/big_buck_bunny_1080p.mp4';
  next();
};

player.use(defaultPathPlugin);

player.launch();
