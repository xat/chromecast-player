# chromecast-player

simple chromecast player.
Relies on the [castv2-client](https://github.com/thibauts/node-castv2-client) lib
from thibauts, all credits go to him.

## Usage

```javascript

var player = require('chromecast-player');

// this will start the playback on the
// first chromecast found in the network.
player('http://commondatastorage.googleapis.com/gtv-videos-bucket/big_buck_bunny_1080p.mp4');

```

### Installation

`npm install chromecast-player`

## License
Copyright (c) 2014 Simon Kusterer
Licensed under the MIT license.