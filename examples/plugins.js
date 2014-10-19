var player = require('../')();

// this sample plugin sets the path to a default
// movie if no path was specified.
var defaultPathPlugin = function(ctx, next) {
  if (ctx.mode !== 'launch') return next();
  if (!ctx.options.path) ctx.options.path = 'http://commondatastorage.googleapis.com/gtv-videos-bucket/big_buck_bunny_1080p.mp4';
  next();
};

player.use(defaultPathPlugin);

player.launch(function(err, p) {
  console.log(arguments);
});
