'use strict';

var Tail = require('file-tail');
var tail = Tail.startTailing('c:/tmp/live.log');
var split = require('split');
var fs = require('fs');

var runde = 0;
var runde_startet;
var siste = 'TEST';


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
	if(line.indexOf('DBG: Game Turn') > -1){
		console.log('Ny tur!');
		runde = line.split(' ').pop();
		runde_startet = new Date();
		for (var i = players.length - 1; i >= 0; i--) {
			players[i].done = false;
		}
	}
	else if (line.indexOf(':NetTurnComplete : Turn Complete') > -1){
		// [449145.161] Net RECV (5) :NetTurnComplete : Turn Complete, 5, 6/9
		var arr = line.split(' ');
		arr.pop();
		var spiller = arr.pop();
		spiller = spiller.substring(0, spiller.length - 1);
		siste = spiller + ' har avsluttet turen sin.';
        for (var i = players.length - 1; i >= 0; i--) {
        	if (players[i].player == spiller) {
        		players[i].done = true;
        	}
		}		
	}
}

tail.on('line', function(line) {  
	 checkLine(line); 
});

module.exports = function (robot) {
	robot.respond(/civ initialize/i, function (res) {
		res.send(':earth_africa: Ok, dette kan ta litt tid.');
		

		fs.createReadStream('c:/tmp/live.log')
    	.pipe(split())
    	.on('data', function (line) {
      		checkLine(line);
    	});
    	if(runde > 0){
        	var timer = Math.abs(new Date() - runde_startet) / 36e5;
        	res.send(':earth_africa: Vi spiller nå runde ' + runde + ', og det er cirka ' + (48-timer).toPrecision(2) + ' timer igjen av runden.');
        	}
	});

	robot.respond(/status/i, function (res) {
		if(runde > 0){
        	var timer = Math.abs(new Date() - runde_startet) / 36e5;
        	res.send(':earth_africa: Vi spiller nå runde ' + runde + ', og det er cirka ' + (48-timer).toPrecision(2) + ' timer igjen av runden.');
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
        	res.send(':waving_white_flag: Spillere som er ferdig med turen sin: '+ferdig + '.');
        
        }
        if(uferdig.length > 0){
			uferdig = uferdig.substring(0, uferdig.length - 2);
	        res.send(':waving_black_flag: Vi venter på: '+uferdig + '.');
		}

    });

    robot.respond(/test/i, function (res) {
    	res.send(':coffee: |' + siste + '|');
    });
}

