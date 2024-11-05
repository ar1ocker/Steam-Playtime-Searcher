# Steam-Playtime-Searcher
A small library for searching for play time on steam. Used for squadjs

In the current implementation, it simply remembers the received time and keeps it in memory

## Using

```js
import { default as PlaytimeSearcher, TIME_IS_UNKNOWN } from "./playtime-searcher.js";

const SQUAD_GAME_ID = 393380;
const ignoreCache = true;
const steamID = 1923981723;

const playtimeAPI = new PlaytimeSearcher(this.options.steam_api_key);

const playtimeObj = await this.playtimeAPI.getPlaytimeByGame(steamID, SQUAD_GAME_ID, ignoreCache);

if (playtimeObj === TIME_IS_UNKNOWN) {
  console.log(playtime.errors);
} else {
  console.log(playtimeObj.playtime);
}
```
