// epsile
// created by djazz
import io from 'socket.io-client';
import './less/epsile.less'

var domID = function (id) {return document.getElementById(id);};
var socket;
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
var url_pattern = new RegExp("([a-zA-Z0-9]+://)?([a-zA-Z0-9_]+:[a-zA-Z0-9_]+@)?([a-zA-Z0-9.-]+\\.[A-Za-z]{2,4})(:[0-9]+)?(/.*)?")



function setTyping(state) {
	if(state) {
		isTypingDiv.style.bottom = 80+"px";
	}
	else {
		isTypingDiv.style.bottom = (80-isTypingDiv.offsetHeight)+"px";
	}
	strangerTyping = state;
}


/*
 * SOCKET ENTRY POINT
 */
function createConnection() {
	// connect to the socket.io server running on same host/port
	socket = io.connect("localhost:8001", {
		reconnect: false,
		'force new connection': true
	});

	chatMainDiv.innerHTML = "";
	logChat(0, {message:"Connecting to server..."});

	// Socket.io builtin function that fires 
	// when a connection to the server is started
	socket.on('connect', function () {
		newStranger()
	});

	// Function received by clients when a match has been made and chats begin
	socket.on('conn', function (data) {
		chatMainDiv.innerHTML = "";
		logChat(0, { message: "You are now chatting with " + data.test + ". Say hi!" });
		isTypingDiv.innerText = data.test + " is typing..."
		disconnectButton.disabled = false;
		disconnectButton.value = "Disconnect";
		chatArea.disabled = false;
		chatArea.value = "";
		chatArea.focus();
	});

	// Function received by clients when the person they are talking to has voluntarily disconnected 
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

	// Function received when a chat is received from other client
	socket.on('chat', function (message) {
		logChat(2, message);
		alertSound.currentTime = 0;
	});

	// Function received when other client is typing
	socket.on('typing', function (state) {
		setTyping(state);
	});

	// Function received when stat numbers are updated	
	socket.on('stats', function (stats) {
		if (stats.people !== undefined) {
			peopleOnlineSpan.innerHTML = stats.people;
		}
		
	});

	
	// Socket.io builtin function that fires 
	// when a connection to the server is terminated
	socket.on('disconnect', function () {
		logChat(0, {message: "Connection imploded"});
		logChat(-1, {message: "<input type=button value='Reconnect' onclick='startChat();'>"});
		peopleOnlineSpan.innerHTML = "0";
		chatArea.disabled = true;
		disconnectButton.disabled = true;
		setTyping(false);
		disconnectType = false;
	});

	
	// Socket.io builtin function that fires 
	// when a connection to the server has an error
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

function isMeAction(message) { return (message.substr(0, 4)==='/me ') }

function doMessageParsing(message){
	let newMessage = message
	return newMessage
		.replace(/\</g, "&lt;")
		.replace(/\>/g, "&gt;")
		.replace(url_pattern, function(match){
			return "<a href="+match.replace(/\n/g, "")+ " target=\"_blank\">"+match.replace(/\n/g, "<br>")+"</a>"
		})
		.replace('/me ', '')
}

function buildChatMessage(type, data){
	let {name, message} = data,
		chatNode = document.createElement("div"),
		senderNode = document.createElement("span"),
		messageNode = document.createElement("span"),
		messageAction = isMeAction(message)
	if (type === 2) {
		senderNode.className = "strangerChat"
		if (messageAction) senderNode.innerHTML = "***"+name+" "
		else senderNode.innerHTML = name+": "
	} else if (type === 1){
		 senderNode.className = "youChat"
		 if (messageAction) senderNode.innerHTML = "***You "
		 else senderNode.innerHTML = "You: "
	} else {
		senderNode.className = "consoleChat"
		senderNode.innerHTML = doMessageParsing(message)
		chatNode.appendChild(senderNode)
		return chatNode
	}
	messageNode.innerHTML = doMessageParsing(message)
	chatNode.appendChild(senderNode)
	chatNode.appendChild(messageNode)
	return chatNode
}

// Possible new logging function that should hopefully be more robust
function newLog(type, data) {
	let chatMessage = buildChatMessage(type, data)
	chatMainDiv.appendChild(chatMessage);
	chatMain.scrollTop = chatMain.scrollHeight;
	chatMain.scrollLeft = 0;
	if(isBlurred && type !== 1) {
		doAlert()
	}
}

function logChat(type, data){
	console.log("redirecting to new log")
	newLog(type,data)
}

function doAlert() {
	alertSound.play();
}

// Hides the start screen, shows the chat screen, and begins server connection
function startChat() {
	if(window.webkitNotifications && notify === 0) {
		if(window.webkitNotifications.checkPermission() === 0) {
			notify = 2;
		}
		else {
			window.webkitNotifications.requestPermission();
			notify = 1;
		}
	} else if(Notification.permission !== 'granted'){
		Notification.requestPermission()
	}
	domID('welcomeScreen').style.display = 'none';
	domID('chatWindow').style.display = 'block';
	createConnection();
};

// For when you already connected to server but need new people
function newStranger() {
	if(socket) {
		chatArea.disabled = true;
		disconnectButton.disabled = true;
		socket.emit("name", {username: domID('username').value});
		chatArea.value = "";
		chatArea.focus();
		chatMainDiv.innerHTML = "";
		logChat(0, {message: "Waiting for a stranger.."});
		setTyping(false);
		disconnectType = false;
		disconnectButton.value = "Disconnect";
	}
};

// For when you don't wanna talk to them no more
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

// Is JS loaded?
function onReady() {
	startButton.disabled = false;
	startButton.focus();
}


setTimeout(onReady, 0);

// For blurred screen (I believe is WIP for notifications)
window.addEventListener("blur", () => {
	isBlurred = true;
	firstNotify = true;
});

// For screen back in focus (I believe is WIP for notifications)
window.addEventListener("focus", () => {
	isBlurred = false;
	if(lastNotify) lastNotify.cancel();
	if(notifyTimer) clearTimeout(notifyTimer);
});

// Attach listeners to buttons
disconnectButton.addEventListener('click', doDisconnect);
startButton.addEventListener('click', startChat);

// Listener for isTyping functionality
chatArea.addEventListener("keypress", (e) => {
	let kc = e.keyCode;
	if(kc === 13 && !e.shiftKey) {
		let msg = chatArea.value;
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
});

// Also listener for isTyping functionality
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