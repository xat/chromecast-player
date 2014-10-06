# chromecast-player

simple chromecast player.
Relies on the [castv2-client](https://github.com/thibauts/node-castv2-client) lib
from thibauts, all credits go to him.

## Usage Samples

```javascript
var player = require('chromecast-player');
var media = 'http://commondatastorage.googleapis.com/gtv-videos-bucket/big_buck_bunny_1080p.mp4';

// this will start the playback on the
// first chromecast found in the network.
player(media);
```

```javascript
// specify the mime-type of the media
// file your gonna play.
player(media, 'video/mp4');
```

```javascript
// stop playback after 5 seconds
player(media, function(err, player) {
    setTimeout(function() {
        player.stop();
    }, 5000);
});
```

```javascript
// ..doing the same using promises
player(media)
    .then(function(player) {
        setTimeout(function() {
            player.stop();
        }, 5000);
    });
```

```javascript
// catch any errors
player(media)
    .catch(function() {
        console.log('ooops, something went wrong');
    });
```

```javascript
// don't autoplay the media file
player(media, { autoplay: false });
```

### Installation

`npm install chromecast-player`

## License
Copyright (c) 2014 Simon Kusterer
Licensed under the MIT license.
