# chromecast-player

simple chromecast player.
Relies on the [castv2-client](https://github.com/thibauts/node-castv2-client) lib
from thibauts, all credits go to him.

### Usage Samples

Start Playback of some video file:

```javascript
var player = require('chromecast-player')();
var media = 'http://commondatastorage.googleapis.com/gtv-videos-bucket/ED_1280.mp4';
player.launch(media, function(err, p) {
  p.once('playing', function() {
    console.log('playback has started.');
  });
});
```

Attach to a currently playing session:

```javascript
var player = require('chromecast-player')();
player.attach(function(err, p) {
  p.pause();
});
```

### Installation

`npm install chromecast-player`

## License
Copyright (c) 2014 Simon Kusterer
Licensed under the MIT license.
