#!/usr/bin/env node
// epsile server
// created by djazz
'use strict';

// config
var port = 8001;

// load and initialize modules
var express = require('express');
var compression = require('compression');
const { match } = require('assert');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

server.listen(port, function () {
	console.log('epsile server listening at port %d', port);
});

app.use(compression());
app.use(express.static(__dirname + '/dist/'));

io.set('log level', 1);

// global variables, keeps the state of the app
var newQueue = []

// helper functions, for logging
function fillZero (val) { return (val > 9) ? ""+val : "0"+val }
function timestamp (now) {
	return "["+fillZero(now.getHours())+":"+fillZero(now.getMinutes())+":"+fillZero(now.getSeconds())+"]";
}
function log(message) { console.log(timestamp(new Date()),message) }

// listen for connections
io.sockets.on('connection', function (socket) {
	

	socket.on('name', function (data) {
		let user = newQueue.find(o => o.socket.id === socket.id)
		if (!user) {
			user = {
				socket: socket, 
				connectedTo: -1,
				username: data.username
			}
			newQueue.push(user)
			io.sockets.emit('stats', {people: newQueue.length});
			log(newQueue.length + " connect");
		} else {
			user.connectedTo = -1
		}
		var stranger = newQueue.find(o => o.connectedTo === -1 && o.socket.id !== socket.id)
		if (stranger) {
			user.connectedTo = stranger.socket;
			user.socket.emit('conn',{test: stranger.username});

			stranger.connectedTo = user.socket;
			stranger.socket.emit('conn', {test: user.username});
		}
	});

	socket.on('chat', function (message) {
		var user = newQueue.find(o => o.socket.id === socket.id)
		var stranger = newQueue.find(o => o.connectedTo.id === user.socket.id)
		stranger.socket.emit('chat', { name: user.username, message: message })
	});

	socket.on('typing', function (isTyping) {
		let user = newQueue.find(o => o.socket.id === socket.id)
		let stranger = newQueue.find(o => o.connectedTo.id === user.socket.id)
		stranger.socket.emit('typing', isTyping)
	});

	// Conversation ended
	socket.on("disconn", function () {
		let user = newQueue.find(o => o.socket.id === socket.id)
		let stranger = newQueue.find(o => o.socket.id === user.connectedTo.id)
		user.connectedTo = 0;
		if (stranger) {
			stranger.connectedTo = 0;
			stranger.socket.emit("disconn", {who: 2, name: user.username});
		}
		user.socket.emit("disconn", {who: 1});
	});

	socket.on("disconnect", function (err) {
		let user = newQueue.find(o => o.socket.id === socket.id)
		let stranger = newQueue.find(o => o.socket.id === user.connectedTo.id)
		let filters = newQueue.filter(value => value.socket.id !== user.socket.id)
		if (stranger){
			stranger.connectedTo = 0
			stranger.socket.emit("disconn", {who: 2, reason: err && err.toString()})
		}
		// Someone disconnected, ctoed or was kicked
		newQueue = filters
		log(newQueue.length + " disconnect");
		io.sockets.emit('stats', {people: newQueue.length});
	});
});

