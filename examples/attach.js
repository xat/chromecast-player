var player = require('../')();

player.attach(function(err, p) {
  if (err) return console.log(err);
  console.log('attached to playback session');
  p.pause();
});
