// Description:
//   Civ-reader reads the content of a Civilization 5 log-file, and some status-updates to your slack-channel.
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//  civ init - initializes the in-memory data structure from the log file.
//	civ timer XX - sets the number of hours left in the round. 
//  civ set runde XX - sets the current round.
//	status - gives the status of the current round.
//

'use strict';

var logFile = process.env.CIV5_LOG;

var Tail = require('file-tail');
var tail = Tail.startTailing(logFile);
var split = require('split');
var fs = require('fs');

var dager_til_start = 0;
var runde = 0;
var runde_startet = false;
var siste = 'TEST';
var init = false;

var eventLogg = [];

var players = [
    {
        player: 0,
        done: false,
        steam: 'Filleriste',
        slack: 'henning'
    },
    {
        player: 1,
        done: false,
        steam: 'Vulpus',
        slack: 'erling'
    },
    {
        player: 2,
        done: false,
        steam: 'tormodh',
        slack: 'tormodh'
    },
    {
        player: 3,
        done: false,
        steam: 'phareim',
        slack: 'petter'
    },
    {
        player: 5,
        done: false,
        steam: 'toreae',
        slack: 'alexander'
    },
    {
        player: 6,
        done: false,
        steam: 'colin.oswald',
        slack: 'colin_oswald'
    },
    {
        player: 7,
        done: false,
        steam: 'Azathosk',
        slack: 'eivind'
    }
];


var test = 1;
module.exports = function (robot) {

    tail.on('line', function (line) {
        checkLine(line);
    });


    function checkLine(line) {
        var nuh = new Date();
        var nuh = '_' + nuh.toLocaleDateString() + ' ' + nuh.toLocaleTimeString() + ':_ ';
        if (line.indexOf('DBG: Game Turn') > -1) {
            runde = line.split(' ').pop();
            runde_startet = new Date();
            for (var i = players.length - 1; i >= 0; i--) {
                players[i].done = false;
            }
            eventLogg.push(nuh + 'Runde ' + runde + ' er startet!');
            if (!init) {
                robot.messageRoom('#sivilisasjonstelegraf', 'Yo @channel! Runde ' + runde + ' er startet!');
            }
            console.log(eventLogg[eventLogg.length - 1]);
        }
        else if (line.indexOf(':NetTurnComplete : Turn Complete') > -1) {
            var arr = line.split(' ');
            arr.pop();
            var spiller = arr.pop();
            spiller = spiller.substring(0, spiller.length - 1);

            for (var i = players.length - 1; i >= 0; i--) {
                if (players[i].player == spiller) {
                    players[i].done = true;
                    eventLogg.push(nuh + players[i].slack + ' har avsluttet turen sin.');
                }
            }
            console.log(eventLogg[eventLogg.length - 1]);
        }
        else if (line.indexOf(':NetPlayerReady') > -1) {
            var str = line.split('Player=').pop();
            str = str.substring(0, str.indexOf(","));
            for (var i = players.length - 1; i >= 0; i--) {
                if (players[i].player == str) {
                    eventLogg.push(nuh + players[i].slack + ' logget på.');
                    players[i].done = false;
                }
            }
            console.log(eventLogg[eventLogg.length - 1]);
        }
    }

    function init(res) {
        init = true;
        res.send(':earth_africa: Ok, dette kan ta litt tid.');

        var readStream = fs.createReadStream(logFile);
        readStream.pipe(split())
            .on('data', function (line) {
                checkLine(line);
            });

        readStream.on('end', function () {
            console.log('DONE!!');
            res.send(':earth_americas: Puh.. ferdig. (sett gjerne gjenværende timer med `civ timer XX`)');
            init = false;
        });
    }

    robot.respond(/civ init/i, function (res) {
        init(res);
    });

    robot.respond(/civ pause/i, function (res) {
        runde = -1;
        res.send(':sunglasses:');

    });


    function status(res) {
        if (runde < 0) {
            res.send(':earth_asia: Spilltelegrafen har tatt seg en pause folkens. Gå ut og slapp av i sola.');
            eventLogg.push(':sunglasses: Vi har tatt en pause.');
            return;
        }
        else if (runde > 0) {

            var timer = Math.abs(new Date() - runde_startet) / 36e5;
            res.send(':earth_africa: Vi spiller nå runde ' + runde + ', og så vidt jeg vet er det ' + (48 - timer).toPrecision(2) + ' timer igjen av runden.');

        }
        else
            res.send(':question: Jeg har dessverre ikke oversikt over hvilken runde vi er på.');
        var ferdig = '';
        var uferdig = '';
        var count = 0;
        for (var i = players.length - 1; i >= 0; i--) {
            if (players[i].done) {
                count++;
                ferdig = ferdig + '@' + players[i].slack + ', ';
            }
            else
                uferdig = uferdig + '@' + players[i].slack + ', ';
        }
        ;

        if (count === 0)
            res.send(':checkered_flag: ingen spillere er ferdig med turen sin.');
        else if (count === 1)
            res.send(':checkered_flag: én spiller er ferdig med turen sin.');
        else
            res.send(':checkered_flag: ' + count + ' spillere er ferdig med turen sin.');

        if (uferdig.length > 0) {
            uferdig = uferdig.substring(0, uferdig.length - 2);
            res.send(':watch: Vi venter på: ' + uferdig + '.');
        }
    }

    robot.respond(/status/i, function (res) {
        status(res);
    });

    robot.respond(/civ status/i, function (res) {
        status(res);
    });

    robot.respond(/civ logg (\d+$)/i, function (res) {
        var antall = res.match[1];
        console.log(antall);
        var a = eventLogg.slice(-antall);
        var print = ':coffee: *Siste ' + antall + ' fra Loggen*\n';
        a.forEach(function (entry) {
            console.log(entry);
            print = print + ':small_blue_diamond: ' + entry + '\n';
        });
        res.send(print);
    });

    robot.respond(/message (\S+) (.*)/i, function (res) {
        robot.messageRoom(res.match[1], res.match[2]);
        console.log('message sent to room ' + res.match[1] + ': ' + res.match[2]);

    });

    robot.respond(/civ timer (\d+$)/i, function (res) {
        var timerIgjen = res.match[1];
        var timerSidenStart = 48 - timerIgjen;
        var nyttStartpunkt = new Date(new Date().getTime() - (timerSidenStart * 60 * 60 * 1000));
        runde_startet = nyttStartpunkt;
        eventLogg.push('Start-tidspunkt satt manuelt. Det er ca. ' + timerIgjen + ' timer igjen til runden er ferdig.');
        res.send('Start-tidspunkt satt manuelt. Det er ca. ' + timerIgjen + ' timer igjen til runden er ferdig.');

    });

    robot.respond(/civ set runde (\d+$)/i, function (res) {
        runde = res.match[1];
        eventLogg.push('runde satt til: ' + runde);
        res.send('runde satt til: ' + runde);
    });
};

