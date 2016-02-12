// Description:
//   Keep track of remaining players in Civilization V
//
// Commands:
//   hubot ferdig - Tell hubot you are done with your turn
//   hubot [spiller] er ferdig - Tell hubot [spiller] is done with their turn
//   hubot ikke ferdig - Tell hubot you are not done with your turn after all
//   hubot [spiller] er ikke ferdig - Tell hubot [spiller] is not done with their turn after all
//   hubot ny tur - Tell hubot it's the next turn already
//   hubot status - Hubot will tell you the turn status
//   hubot [spiller] er ute - Tell hubot a player has left/lost the game
//   hubot jeg er ute - Tell hubot you have left/lost the game
//   hubot civ add [player] - Add a player
//   hubot civ clear - Reset hubot's memory for Civilization

'use strict';


module.exports = function (robot) {

    var players = {};

    var playersRemaining = function playersRemaining() {
        return Object.keys(players).filter(function (player) {
            return !players[player].done;
        });
    };

    var playerList = function playerList() {
        return Object.keys(players);
    };

    var nextTurn = function nextTurn() {
        for (var player in players) {
            players[player].done = false;
        }
    };

    var listify = function listify(array) {
        return array.map(function (item) {
            return '@' + item;
        }).join(', ');
    };

    var stripName = function stripName(name) {
        if (name[0] === '@') name = name.slice(1, name.length);
        return name;
    };

    // hubot [spiller] er ferdig
    robot.respond(/(.*)ferdig/i, function (res) {
        var player = undefined;
        var modifiers = [];
        var modifier = res.match[1];

        if (modifier) {
            modifiers = modifier.trim().split(' ');
            player = modifiers[0];
            player = stripName(player);
            if (player === 'jeg') player = res.message.user.name;
        } else {
            player = res.message.user.name;
        }

        if (modifier && modifiers && modifiers[modifiers.length - 1] === 'ikke') {

            players[player].done = false;

            var remaining = playersRemaining().length;
            var unit = remaining == 1 ? 'spiller' : 'spillere';
            res.reply('Ok. Da venter vi på ' + remaining + ' ' + unit + '.');
        } else {

            players[player].done = true;

            if (playersRemaining().length > 0) {
                var remaining = playersRemaining().length;
                var unit = remaining == 1 ? 'spiller' : 'spillere';
                res.reply('Supert. Da venter vi bare på ' + remaining + ' ' + unit + '.');
            } else {
                nextTurn();
                res.send('@channel: Hurra! Da er vi klar for neste tur!');
            }
        }
    });

    // hubot next turn
    robot.respond(/ny tur/i, function (res) {
        nextTurn();
        res.reply('Hurra! Da er vi visst klare for neste tur!');
    });

    // hubot [spiller] er ute
    robot.respond(/(.*) er ute/i, function (res) {
        var player = res.match[1];
        player = stripName(player);
        if (player === 'jeg') player = res.message.user.name;

        delete players[player];

        res.send('Historien vil bevare ' + player + 's minne, og ære deres kamp!');
        res.send('Da er det ' + playerList().length + ' spillere igjen.');
    });

    // hubot civ add [player list]
    robot.respond(/civ add (.*)/i, function (res) {
        
        var newPlayers = res.match[1].split(" ");
        
        newPlayers.forEach(function(entry){
            try {
                players[entry] = players[entry] || { done: false };
            } catch (err) {
                res.reply('Auda: ' + err);
            }
        });

        res.reply('Ok, da har vi følgende spillere: ' + listify(playerList()));
    });

    // hubot civ clear
    robot.respond(/civ clear/i, function (res) {
        players = {};

        res.reply('BZZT! ...øh... Ok, hvor var vi igjen?');
    });
};