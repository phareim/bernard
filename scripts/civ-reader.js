'use strict';

var logFile   = process.env.CIV5_LOG;

var Tail = require('file-tail');
var tail = Tail.startTailing(logFile);
var split = require('split');
var fs = require('fs');

var runde = 0;
var runde_startet = false;
var siste = 'TEST';

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
function checkLine(line) {
	var nuh = new Date();
	var nuh = '_'+nuh.toLocaleDateString() + ' ' + nuh.toLocaleTimeString() + ':_ ';
	if(line.indexOf('DBG: Game Turn') > -1){
		runde = line.split(' ').pop();
		runde_startet = new Date();
		for (var i = players.length - 1; i >= 0; i--) {
			players[i].done = false;
		}
		eventLogg.push( nuh + 'Runde '+ runde +' er startet!' );
		console.log(eventLogg[eventLogg.length-1]);
	}
	else if (line.indexOf(':NetTurnComplete : Turn Complete') > -1){
		// [449145.161] Net RECV (5) :NetTurnComplete : Turn Complete, 5, 6/9
		var arr = line.split(' ');
		arr.pop();
		var spiller = arr.pop();
		spiller = spiller.substring(0, spiller.length - 1);
		
        for (var i = players.length - 1; i >= 0; i--) {
        	if (players[i].player == spiller) {
        		players[i].done = true;
        		eventLogg.push( nuh + players[i].slack  +' har avsluttet turen sin.');
        	}
		}		
		console.log(eventLogg[eventLogg.length-1]);
	}
	else if (line.indexOf(':NetPlayerReady') > -1) {
		
		// [574290.318] Net RECV (1) :NetPlayerReady(Player=3, count=2 / 2)
		var str = line.split('Player=').pop();
		str = str.substring(0, str.indexOf(","));
		for (var i = players.length - 1; i >= 0; i--) {
        	if (players[i].player == str) {
        		eventLogg.push(nuh + players[i].slack +' logget på.');
        		players[i].done = false;
        	}
		}
		console.log(eventLogg[eventLogg.length-1]);
	}
	/*else if(line.indexOf(':m_iGameTurn') > -1){
		// m_iGameTurn=59
		console.log('---------------------');
		console.log(line);
		var runde = line.split('m_iGameTurn=').pop();
		console.log(runde);
		var tall = runde.split(' ')[0];
		eventLogg.push( nuh + 'Runde '+ tall +' er lastet fra Save-fil!' );
		runde_startet = new Date();
		console.log('---------------------');
	}*/
}

tail.on('line', function(line) {  
	 checkLine(line); 
});

module.exports = function (robot) {
	robot.respond(/civ init/i, function (res) {
		res.send(':earth_africa: Ok, dette kan ta litt tid.');
		
		fs.createReadStream(logFile)
    	.pipe(split())
    	.on('data', function (line) {
      		checkLine(line);
    	});
    	if(runde > 0){
        	var timer = Math.abs(new Date() - runde_startet) / 36e5;
        	res.send(':earth_africa: Vi spiller nå runde ' + runde + ', og jeg tror (?) det er cirka ' + (48-timer).toPrecision(2) + ' timer igjen av runden.');
        }
        else {
        	res.send(':earth_americas: Puhh, ferdig..');
        }
	});

	robot.respond(/status/i, function (res) {
		if(runde > 0){
			
	        var timer = Math.abs(new Date() - runde_startet) / 36e5;
	        res.send(':earth_africa: Vi spiller nå runde ' + runde + ', og jeg tror (?) det er cirka ' + (48-timer).toPrecision(2) + ' timer igjen av runden.');
        	
        	}
        else
        	res.send(':question: Jeg har dessverre ikke oversikt over hvilken runde vi er på.');
        var ferdig = '';
        var uferdig = '';

        for (var i = players.length - 1; i >= 0; i--) {
        	if (players[i].done)
        		ferdig = ferdig + '@' + players[i].slack+ ', ';
        	else
        		uferdig = uferdig + '@' + players[i].slack+ ', ';
        };
        if(ferdig.length > 0){
        	ferdig = ferdig.substring(0, ferdig.length - 2);
        	res.send(':checkered_flag: Spillere som er ferdig med turen sin: '+ferdig + '.');
        
        }
        if(uferdig.length > 0){
			uferdig = uferdig.substring(0, uferdig.length - 2);
	        res.send(':watch: Vi venter på: '+uferdig + '.');
		}

    });

    robot.respond(/civ logg (\d+$)/i, function (res) {
    	var antall = res.match[1];
    	console.log(antall);
    	var a = eventLogg.slice(-antall);
    	var print = ':coffee: *Siste ' + antall + ' fra Loggen*\n';
    	a.forEach(function(entry) {
   			 console.log(entry);
   			 print = print + ':small_blue_diamond: ' + entry +'\n';
		});
    	res.send(print);
    });
}

