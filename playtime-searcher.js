import axios from "axios";

// A label in players_playtimes_cache that means that the user's time is unknown
export const TIME_IS_UNKNOWN = -1;

let PLAYERS_PLAYTIMES_CACHE = new Map();

export default class PlaytimeSearcher {
  constructor(apiKey) {
    this.apiKey = apiKey;

    this.apis = [
      {
        name: "GetRecentlyPlayedGames",
        api: axios.create({
          baseURL: `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/`,
          params: {
            key: apiKey,
          },
          timeout: 30000,
        }),
      },
      {
        name: "GetOwnedGames",
        api: axios.create({
          baseURL: `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/`,
          params: {
            key: apiKey,
            include_appinfo: true,
          },
          timeout: 30000,
        }),
      },
    ];

    this.getPlaytimeByGame = this.getPlaytimeByGame.bind(this);
    this.processingGetPlaytime = this.processingGetPlaytime.bind(this);
  }

  async getPlaytimeByGame(playerSteamID, gameID, ignoreCache = false) {
    let errors = [];

    if (!ignoreCache) {
      let cachedPlaytime = PLAYERS_PLAYTIMES_CACHE.get(`${gameID}-${playerSteamID}`);
      if (cachedPlaytime) {
        return new ReturnedPlaytime(cachedPlaytime);
      }
    }

    for (let index in this.apis) {
      let returnPlaytime = await this.processingGetPlaytime(this.apis[index].api, `${playerSteamID}`, `${gameID}`);

      if (returnPlaytime.playtime === TIME_IS_UNKNOWN) {
        errors = errors.concat(returnPlaytime.errors.map((error) => `${this.apis[index].name}: ${error}`));
        continue;
      }

      PLAYERS_PLAYTIMES_CACHE.set(`${gameID}-${playerSteamID}`, returnPlaytime.playtime);
      return returnPlaytime;
    }

    PLAYERS_PLAYTIMES_CACHE.set(`${gameID}-${playerSteamID}`, TIME_IS_UNKNOWN);
    return new ReturnedPlaytime(TIME_IS_UNKNOWN, errors);
  }

  async processingGetPlaytime(api, playerSteamID, gameID) {
    let response;

    try {
      response = await api({
        params: {
          steamid: playerSteamID,
        },
      });
    } catch (error) {
      return new ReturnedPlaytime(
        TIME_IS_UNKNOWN,
        `Player ${playerSteamID} is ${TIME_IS_UNKNOWN} because their time request returned the error ${error}`
      );
    }

    const data = await response.data;
    const playerGames = data.response?.games;

    if (playerGames === undefined) {
      return new ReturnedPlaytime(
        TIME_IS_UNKNOWN,
        `Player ${playerSteamID} is ${TIME_IS_UNKNOWN} because their games response was empty`
      );
    }

    let gamePlaytime = playerGames.find((item) => item.appid == gameID)?.playtime_forever;

    if (gamePlaytime === undefined) {
      return new ReturnedPlaytime(
        TIME_IS_UNKNOWN,
        `Player ${playerSteamID} is ${TIME_IS_UNKNOWN} because the squad game was not found on his account`
      );
    }

    if (gamePlaytime === 0) {
      return new ReturnedPlaytime(
        TIME_IS_UNKNOWN,
        `Player ${playerSteamID} is ${TIME_IS_UNKNOWN}, because their minutes in the game == 0`
      );
    }

    gamePlaytime = gamePlaytime / 60;

    return new ReturnedPlaytime(gamePlaytime);
  }
}

class ReturnedPlaytime {
  constructor(playtime, errors = []) {
    this.playtime = playtime;

    if (typeof errors === "string") {
      this.errors = [errors];
    } else {
      this.errors = errors;
    }
  }
}
