module.exports = function (tennu) {
	var moment = require('moment');
	var fs = require('fs');
	var lodash = require('lodash');

	var nicklist = {};

	var formattedMessage = function(target, msg) {
		return target + ":" + " " + msg.sender + 
		       " left a message for you at " + 
			   moment(msg.timestamp).format("MMM Do YYYY H:mm") + 
			   " - \"" + msg.message +"\"";
	}

	var playMessage = function(target, msg, channel) {
		console.log("Playing message: " + JSON.stringify(msg));
		if (msg.visibility === "public") {
			tennu.say(channel, formattedMessage(target, msg));
		} else {
			tennu.say(target, formattedMessage(target, msg));
		}
	}

	var checkForMessages = function(target, channel) {
		var result = nicklist[target.toLowerCase()];
		if (typeof(result) === 'undefined') {
			return;
		} else {
			console.log("Found " + result.length + " message(s)")
			for (var msg in result) {
				playMessage(target, result[msg], channel);
			}
			delete nicklist[target.toLowerCase()];
		}
	};
	var objectFromArgs = function(sender, visibility, target, message) {
		return { "sender": sender, "visibility": visibility, "target": target, "message": message, "timestamp": new Date()}
	};

	var storeMessage = function(sender, visibility, target, message) {
		console.log("Storing message: " + JSON.stringify(arguments));
		var oldMessages = nicklist[target.toLowerCase()];
		if (typeof(result) === 'undefined') {
			nicklist[target.toLowerCase()] = [ objectFromArgs(sender, visibility, target, message) ];
		} else {
			nicklist[target.toLowerCase()] = 
			   nicklist[target.toLowerCase()].push( objectFromArgs(sender, visibility, target, message));
		}
	};
	return {
		dependencies: [],
		exports: {
			help: "Usage:  seen <nick>"
		},
		handlers: {
			"!message": function(command) {
				var visibility = command.args.shift();
				var target = command.args.shift();
				if ((visibility !== "public" && visibility !== "private") || (typeof(target) === 'undefined')) {
					tennu.say(command.channel, "Usage !message public|private nickname message");
					return;
				}
				storeMessage(command.hostmask.nickname, visibility, target, command.args.join(' '));
			},
			"!store": function(command) {
				var txt = JSON.stringify(nicklist, null, 4);
				fs.writeFile('messages.log', txt, {}, function(err) {
					if (err) throw err;
				});
			},
			"!load": function(command) {
				fs.readFile('messages.log', {}, function(err, data) {
					if (err) {
						console.log("Unable to read log file");
						return;
					}
					var oldList = JSON.parse(data);
					nicklist = lodash.defaults(nicklist, oldList);
				});
			},
			"privmsg": function(message) {
				checkForMessages(message.hostmask.nickname, message.channel);
			},
			"join": function(message) {
				checkForMessages(message.hostmask.nickname, message.channel);
			}
		}
	};
};
