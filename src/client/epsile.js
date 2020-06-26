// epsile
// created by djazz
import io from 'socket.io-client';

require('./less/epsile.less')

var domID = function (id) {return document.getElementById(id);};
var socket;
var username = domID('username');
var welcomeScreen = domID('welcomeScreen');
var chatWindow = domID('chatWindow');
var chatMain = domID('chatMain');
var chatMainDiv = domID('chatMainDiv');
var chatArea = domID('chatArea');
var disconnectButton = domID('disconnectButton');
var startButton = domID('startButton');
var isTypingDiv = domID('isTypingDiv');
var peopleOnlineSpan = domID('peopleOnlineSpan');
var typingtimer = null;
var isTyping = false;
var strangerTyping = false;
var disconnectType = false;
var isBlurred = false;
var notify = 0;
var firstNotify = true;
var lastNotify = null;
var notifyTimer = null;
var url_pattern = /https?:\/\/([-\w\.]+)+(:\d+)?(\/([\w/_\.]*(\?\S+)?)?)?/;


function setTyping(state) {
	if(state) {
		isTypingDiv.style.bottom = 80+"px";
	}
	else {
		isTypingDiv.style.bottom = (80-isTypingDiv.offsetHeight)+"px";
	}
	strangerTyping = state;
}

function createConnection() {

	// connect to the socket.io server running on same host/port
	socket = io.connect("localhost:8001", {
		reconnect: false,
		'force new connection': true
	});

	chatMainDiv.innerHTML = "";
	logChat(0, {message:"Connecting to server..."});

	socket.on('connect', function () {
		chatMainDiv.innerHTML = "";
		logChat(0, {message: "Waiting for a stranger.."});
		setTyping(false);
		socket.emit("name", {username: username.value});
	});

	socket.on('conn', function (data) { // Connected
		chatMainDiv.innerHTML = "";
		logChat(0, { message: "You are now chatting with " + data.test + ". Say hi!" });
		isTypingDiv.innerText = data.test + " is typing..."
		disconnectButton.disabled = false;
		disconnectButton.value = "Disconnect";
		chatArea.disabled = false;
		chatArea.value = "";
		chatArea.focus();
	});

	socket.on('disconn', function (data) {
		var { who, name, reason } = data;
		chatArea.disabled = true;
		
		switch (who) {
			case 1:
				logChat(0, {message:"You disconnected."});
				break;
			case 2:
				logChat(0, {message: name + " disconnected."});
				if (reason) {
					logChat(0, {message:"Reason: " + reason});
				}
				break;
		}
		clearTimeout(typingtimer);
		isTyping = false;
		setTyping(false);
		disconnectType = true;
		disconnectButton.disabled = false;
		disconnectButton.value = "New";
		chatArea.disabled = true;
		chatArea.focus();
	});

	socket.on('chat', function (message) {
		logChat(2, message);
		alertSound.currentTime = 0;
	});

	socket.on('typing', function (state) {
		setTyping(state);
	});

	socket.on('stats', function (stats) {
		if (stats.people !== undefined) {
			peopleOnlineSpan.innerHTML = stats.people;
		}
		
	});

	socket.on('disconnect', function () {
		logChat(0, {message: "Connection imploded"});
		logChat(-1, {message: "<input type=button value='Reconnect' onclick='startChat();'>"});
		peopleOnlineSpan.innerHTML = "0";
		chatArea.disabled = true;
		disconnectButton.disabled = true;
		setTyping(false);
		disconnectType = false;
	});

	socket.on('error', function (e) {
		logChat(0, {message: "Connection error"});
		logChat(-1, {message: "<input type=button value='Reconnect' onclick='startChat();'>"});
		peopleOnlineSpan.innerHTML = "0";
		chatArea.disabled = true;
		disconnectButton.disabled = true;
		setTyping(false);
		disconnectType = false;
	});
}

function logChat(type, data) {
	var {name, message} = data
	var who = "";
	var who2 = "";
	var message2 = message;
	var node = document.createElement("div");
	if(type > 0) {
		if(type===2) {
			who = "<span class='strangerChat'>"+name+": <\/span>";
			who2 = "Stranger: ";
		}
		else {
			who = "<span class='youChat'>You: <\/span>";
		}
		if(message.substr(0, 4)==='/me ') {
			message = message.substr(4);
			if(type===2) {
				who = "<span class='strangerChat'>*** "+name+" <\/span>";
				who2 = "*** Stranger ";
			}
			else {
				who = "<span class='youChat'>*** You <\/span>";
			}
		}
		message = message.replace(/\</g, "&lt;").replace(/\>/g, "&gt;");
		var msg = message.split(" ");
		for(var i=0; i < msg.length; i+=1) {
			if(url_pattern.test(msg[i]) && msg[i].indexOf("\"") === -1) {
				msg[i] = "<a href=\""+msg[i].replace(/\n/g, "")+"\" target=\"_blank\">"+msg[i].replace(/\n/g, "<br>")+"</a>";
			}
			else {
				msg[i] = msg[i].replace(/\n/g, "<br>");
			}
		}
		message = msg.join(" ");
		node.innerHTML = who + message;
	}
	else {
		node.innerHTML = "<span class='consoleChat'>"+message+"<\/span>";
	}
	chatMainDiv.appendChild(node);
	chatMain.scrollTop = chatMain.scrollHeight;
	chatMain.scrollLeft = 0;
	if(isBlurred && (type === 0 || type === 2)) {
		alertSound.play();
		if(firstNotify && notify > 0 && window.webkitNotifications.checkPermission() === 0) {
			clearTimeout(notifyTimer);
			if(lastNotify) lastNotify.cancel();
			lastNotify = window.webkitNotifications.createNotification('img/epsile_logo32.png', 'Epsile'+(type===0?' Message':''), who2+message2);
			lastNotify.show();
			firstNotify = false;
			notifyTimer = setTimeout(function () {
				lastNotify.cancel();
			}, 7*1000);
		}
	}
}

function startChat() {
	if(window.webkitNotifications && notify === 0) {
		if(window.webkitNotifications.checkPermission() === 0) {
			notify = 2;
		}
		else {
			window.webkitNotifications.requestPermission();
			notify = 1;
		}
	}
	welcomeScreen.style.display = 'none';
	chatWindow.style.display = 'block';
	createConnection();
};

function newStranger() {
	if(socket) {
		chatArea.disabled = true;
		disconnectButton.disabled = true;
		socket.emit("name", {username: username.value});
		chatArea.value = "";
		chatArea.focus();
		chatMainDiv.innerHTML = "";
		logChat(0, {message: "Waiting for a stranger.."});
		setTyping(false);
		disconnectType = false;
		disconnectButton.value = "Disconnect";
	}
};

function doDisconnect() {
	if(disconnectType===true) {
		disconnectType = false;
		disconnectButton.value = "Disconnect";
		newStranger();
	}
	else if(socket) {
		socket.emit("disconn");
		chatArea.disabled = true;
		chatArea.focus();
		disconnectType = true;
		disconnectButton.disabled = true;
		disconnectButton.value = "Disconnect";
	}
};


function onReady() {
	startButton.disabled = false;
	startButton.focus();
}
setTimeout(onReady, 0);

window.addEventListener("blur", () => {
	isBlurred = true;
	firstNotify = true;
});

window.addEventListener("focus", () => {
	isBlurred = false;
	if(lastNotify) lastNotify.cancel();
	if(notifyTimer) clearTimeout(notifyTimer);
});

disconnectButton.addEventListener('click', doDisconnect);
startButton.addEventListener('click', startChat);

chatArea.addEventListener("keypress", (e) => {
	var kc = e.keyCode;
	if(kc === 13) {
		if(!e.shiftKey) {
			var msg = chatArea.value;
			if(msg.length > 0) {
				if(typingtimer!==null) {
					clearTimeout(typingtimer);
				}
				if(isTyping) {
					socket.emit("typing", false); // Not typing
				}
				isTyping = false;
				socket.emit("chat", msg);
				logChat(1, {message: msg});
				chatArea.value = "";
			}
			e.preventDefault();
			e.returnValue = false;
			return false;
		}
	}
});

chatArea.addEventListener("keyup", function (e) {
	if (socket) {
		if (typingtimer!==null) {
			clearTimeout(typingtimer);
		}
		
		if (chatArea.value === "" && isTyping) {
			socket.emit("typing", false); // Not typing
			isTyping = false;
		}
		else {
			if (!isTyping && chatArea.value.length > 0) {
				socket.emit("typing", true);
				isTyping = true;
			}
			
			typingtimer = setTimeout(function () {
				if(socket && isTyping) {
					socket.emit("typing", false); // Not typing
				}
				isTyping = false;
			}, 10*1000);
		}
	}
});




