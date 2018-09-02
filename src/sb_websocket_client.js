//import { join } from 'path'
//import WebSocket from 'ws'

module.exports = (ln, lnd) => {
  //these can be initalized with a 'sendInfoMsg' call
  var seasonYear = null;
  var seasonType = null;
  var week = null;

  const handleMsg = message => {
    console.log("handleMsg " + message);
    const json = JSON.parse(message)
    if (json.hasOwnProperty('invoice')) {
      pay(json['invoice']);
    } else if (json.hasOwnProperty('seasonType')) {
      //info channel
      handleInfoMsg(json)
    } else {
      console.log(message);
    }
  }

  const info = wsp => {
    return sendMessage(wsp,{"channel" : "info"});
  }
  
  const sendMessage = (wsp, msg) => {
    const uuidv1 = require('uuid/v1');
    const invoiceId = uuidv1();
    const invoiceP = wsp.sendRequest(msg, {requestId: invoiceId});
    invoiceP.then(invoice => console.log("LN Invoice : " + JSON.stringify(invoice) + "\n"));
    const payLoadP = invoiceP.then(() => createSyntheticRequest(wsp, invoiceId)); 
    const paidP = invoiceP.then(i => pay(i)); 
    //paidP.then(p => console.log("LN Invoice Payment: " + JSON.stringify(p) + "\n"));
    return payLoadP.then(payload => payload['data']);
  }
  
  const createSyntheticRequest = (wsp,uuid) => { 
    //this is a hack to add another request to the queue
    //this is how we actually return the right Promise
    //back to the caller of an API
    return wsp._requests
      .create(uuid, () => {
        return ;     
      }, 0);

  }

  const pay = payload => {
    const invoice = payload['invoice'];
    //console.log("invoice " + invoice);
    var paid = null;
    try {
      paid = ln.payInvoice({ 
        invoice : invoice, 
      	lnd : lnd, 
      }, cbk);
    } catch (e) {
      console.log("error paying invoice");
      console.log("response from sb-api " + JSON.stringify(payload));
      throw e;
    }
    return paid; 
  }

  const team_roster = (wsp, teamId) => {
    const msg = {
      "channel" : "team",
      "teamId" : teamId,
      "retrieve" : "roster"
    };

    return sendMessage(wsp,msg);
  }
  
  const team_schedule = (wsp, teamId, year) => {
    const msg = {
      "channel" : "team",
      "teamId" : teamId,
      "retrieve" : "schedule",
      "year" : year
    };
    return sendMessage(wsp,msg);
  }

  const games = (wsp,week,seasonPhase,year,teamId) => {
    const msg = {
      "channel" : "games",
      "week" : week,
      "seasonPhase" : seasonPhase,
      "year" : year,
      "teamId": teamId,
      "realtime" : false,
    };
    return sendMessage(wsp,msg);
  }

  const realtime_games = (wsp, teamId) => {
    const metaP = info(wsp);
    const games = metaP.then(meta =>
      sendMessage(wsp,build_realtime_msg(meta,teamId))
    )

    return games;
  }

  const games_this_week = (wsp) => {
    //{"version":"8","lastRosterDownload":"20180801T153829.816Z","seasonType":"Regular","seasonYear":2017,"week":"NflWeek17"}
    const metaP = info(wsp);
    const thisWeek = metaP
      .then(m => games(wsp,
        parseWeek(m['week']),
        m['seasonType'],
        m['seasonYear']));

    return thisWeek;
  }

  const games_today = (wsp) => {
    const this_weekP = games_this_week(wsp);
    return this_weekP.then(this_week => filter_today(this_week));
  }
  
  const player = (wsp, lastname,firstname) => {
    const msg = {
      "channel" : "players",
      "lastName" : lastname,
      "firstName" : firstname
    };
    return sendMessage(wsp,msg);
  }

  const stats_game_player_id = (wsp, stat_type, gameid, playerid) => {
    const msg = {
      "channel" : "stats",
      "statType" : stat_type,
      "gameId" : gameid,
      "playerId" : playerid
    };
    return sendMessage(wsp,msg);
  }

  const stats_name_week = (wsp, stat_type, year, week, seasonPhase, lastname, firstname) => {
    const msg = {
      "channel" : "stats",
      "statType" : stat_type,
      "year" : year,
      "week" : week,
      "seasonPhase" : seasonPhase,
      "lastName" : lastname,
      "firstName" : firstname
    };
    return sendMessage(wsp,msg);
  }

  /** Currently the api returns in the format of 'NflWeekX'
    * This is really annoying, this breaks on the 'k' in week
    * and then parses the number
    */
  function parseWeek(week) {
    const weekString = week.split('k')[1];
    return parseInt(weekString);
  }

  /** Takes in a list of games and finds ones that happenign today */
  function filter_today(this_week) {
    const today = new Date()
    const timezoneOffset = today.getTimezoneOffset();
    var gamesToday = [];
    for (var i = 0; i < this_week.length; i++) {
      var date = new Date(this_week[i]['startTime']);

      //convert UTC timezone to user's timezone
      //so they see expected games
      const locale = date.toLocaleDateString();

      if (locale === today.toDateString()) {
        gamesToday += this_week[i];
      }
    }

    return gamesToday;
  }

  function build_realtime_msg(meta,teamId) {
    const msg = {
      "channel" : "games",
      "week" : parseWeek(meta['week']),
      "seasonPhase" : meta['seasonType'],
      "year" : meta['seasonYear'],
      "teamId": teamId,
      "realtime" : true,
    };

    return msg;
  }

  function cbk(a) { }

  return { info, 
    team_roster, team_schedule, 
    games, realtime_games, games_this_week, games_today,
    player,
    stats_game_player_id,
    stats_name_week
  };

}
