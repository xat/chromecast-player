# chromecast-player

simple chromecast player.
Relies on the [castv2-client](https://github.com/thibauts/node-castv2-client) lib
from thibauts, all credits go to him.

### Usage Samples

this will start the playback of an media file on the
first chromecast found in the network.
pretty simple, huh? :-)
```javascript
var player = require('chromecast-player');
var media = 'http://commondatastorage.googleapis.com/gtv-videos-bucket/big_buck_bunny_1080p.mp4';
player(media);
```

there is the possibility that the player can't detect the
mime-type of the media by it's own. In this case you
may want to specifiy it like this:
```javascript
player(media, 'video/mp4');
```

you can define a callback function which
will get an playback instance handed it once
the video is loaded.
```javascript
player(media, function(err, p) {
    // stop playback after 5 seconds
    setTimeout(function() {
        p.stop();
    }, 5000);
});
```

### Options

```javascript

player({

  // the URL to the media file
  path: 'http://foo.com/bar.mp4',

  // the mime-type of the media file
  type: 'video/mp4',

  // by default chromecast-player will start playback
  // on the first found chromecast device in the network.
  // however, you can als define the devicename explizit.
  // this is useful if you have more then one chromecast.
  device: 'xat-cast',

  // define if the media should automaticly be playbacked
  // once it is loaded.
  autostart: true,

  // for how long should the player try to
  // find the chromecast devive?
  ttl: 10000,

  // define if it's a LIVE or a BUFFERED stream
  streamType: 'BUFFERED',

  // this is an object where you can specify some
  // meta data like the title or an cover image
  metadata: { title: 'my awesome homevideo..' },

});

```

### Installation

`npm install chromecast-player`

## License
Copyright (c) 2014 Simon Kusterer
Licensed under the MIT license.
