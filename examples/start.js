var player = require('../')();

player.launch('http://commondatastorage.googleapis.com/gtv-videos-bucket/big_buck_bunny_1080p.mp4', function(err, p) {
  p.once('playing', function() {
    console.log('playback started');
  });
});
