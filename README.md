# chromecast-player

A simple chromecast player.
Relies on the [castv2-client](https://github.com/thibauts/node-castv2-client) lib
from thibauts, all credits go to him.

### Usage Samples

Start Playback of some video file:

```js
const player = require('chromecast-player')();
const media = 'http://commondatastorage.googleapis.com/gtv-videos-bucket/ED_1280.mp4';

player.launch(media, (err, p) => {
  p.once('playing', () => {
    console.log('playback has started.');
  });
});
```

Attach to a currently playing session:

```javascript
const player = require('chromecast-player')();

player.attach((err, p) => {
  p.pause();
});
```

### Installation

```bash
npm install chromecast-player --save
```

## License
Copyright (c) 2014 Simon Kusterer
Licensed under the MIT license.
