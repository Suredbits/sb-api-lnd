import { join } from 'path'
import wrap from './lib/promise-wrap'
import WebSocket from 'ws'


const lnPath = process.env.LN_PATH || join(require('os').homedir(), '.lightning')

//start web socket here
function start() {

  const W3CWebSocket = require('websocket').w3cwebsocket;
  const WebSocketAsPromised = require('websocket-as-promised');
  const ln = require("ln-service");

  const cert = process.env.LND_CERT 

  const macaroon = process.env.LND_MACAROON 

  const lnd = ln.lightningDaemon({
    cert: cert,
    host: 'localhost:10009',
    macaroon: macaroon,
  });

  ln.getWalletInfo({lnd}, (error, result) => {
    console.log("error " + error);
    console.log("result for getwalletinfo "  + result);
  });

  const sb_client = require('./sb_websocket_client.js')(ln,lnd);
  const uuidv1 = require('uuid/v1');
  const wsUrl = "wss://test.api.suredbits.com/nfl/v0";
  const client = new W3CWebSocket(wsUrl);
  const wsp = new WebSocketAsPromised(wsUrl, {
    createWebSocket: url => new W3CWebSocket(url),
    packMessage: data => {
       const stringify = JSON.stringify(data);
       console.log("API Request:  " + stringify + "\n");
       return stringify;
     },
    unpackMessage: message => {
      const parse = JSON.parse(message);
      return parse;
    },
    attachRequestId: (data,requestId) => {
      const result = Object.assign({uuid: requestId}, data);
      return result;
    },
    extractRequestId: data => {
      return data.uuid;
    },
  });


  
  wsp.open()
  .then(() => loop(wsp))
  

  function loop(wsp) {
   content();
     setInterval(function () {
       content();
     },10000)

  };

  function content() {

    const scoreboard = sb_client.realtime_games(wsp)
    .then(realtime => games_today_if_no_realtime(realtime))
    .then(games => games_this_week_if_none_today(games));

    scoreboard.then(msg => console.log("Scoreboard: " + json_to_string(msg) + "\n**************************************************************\n"));
  }

  function tom_brady_superbowl_stats() {
    const player = sb_client.player(wsp, "Brady", "Tom");

    const game = sb_client.games(wsp, 4, "Postseason", 2017, "NE");

    const result = player.then(p =>
      game.then(g =>
        sb_client.stats_game_player_id(
          wsp,
          "passing",
	  g[0]['gsisId'],
	  p[0]['playerId'])));
    return result;
  }

    /** Returns the player's stats for the given week */
  function player_stats_this_week(lastname, firstname, stattype) { 
    const playerP = sb_client.player(wsp, lastname, firstname);
    const metaP = sb_client.info(wsp);
    const gameP =  metaP.then(m => sb_client.games(
      wsp,
      parseWeek(m['week']),
      m['seasonType'], 
      m['seasonYear'], 
      'CHI'
    ));

    const stats = playerP.then(p => 
      gameP.then(g =>
        sb_client.stats_game_player_id(
          wsp, 
          stattype,
	  g[0]['gsisId'],
	  p[0]['playerId']
        )
      )
    );

    return stats;
  }

  function joe_flacco_stats_this_week() {
    return player_stats_this_week("Flacco", "Joe", "passing");
  }

  function mitchell_trubisky_stats_this_week() {
    return player_stats_this_week("Trubisky", "Mitchell", "passing");
  }

  function parseWeek(week) {
    const weekString = week.split('k')[1];
    return parseInt(weekString);
  }

  function json_to_string(stats) { 
    return JSON.stringify(stats,null,' ');
  }

  /** Queries for games today if no real time games given */
  function games_today_if_no_realtime(games) {
    //if no games are currently on going
    //show games today
    if (games.length == 0) {
      return sb_client.games_today(wsp);
    } else {
      return games;
    }
  }

  function games_this_week_if_none_today(games) {
    //if no games are going on today, get the games this week
    if (games.length == 0) {
      return sb_client.games_this_week(wsp);
    } else {
      return games;
    }
  }
}

start();
