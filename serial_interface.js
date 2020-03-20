var serialPort = [];
var serialConnections = [];

chrome.runtime.onConnectExternal.addListener(
	function(port) {
		var portIndex =  getGUID();
		serialPort[portIndex] = port;
		port.postMessage({header: "guid", guid: portIndex});
		port.onDisconnect.addListener(
			function(){
				serialPort.splice(portIndex, 1);
				console.log("Web page closed guid " + portIndex);
			}
		);

		console.log("New web page with guid " + portIndex);
	}
);

chrome.runtime.onMessageExternal.addListener(
	function(request, sender, sendResponse) {

		if(request.cmd === "open"){
			openPort(request, sender, sendResponse);
		}
		else if(request.cmd === "close"){
			closePort(request, sender, sendResponse);
		}
		else if(request.cmd === "list"){
			getPortList(request, sender, sendResponse);
		}
		else if(request.cmd === "write"){
			writeOnPort(request, sender, sendResponse);
		}
		else if(request.cmd === "installed"){
			checkInstalled(request, sender, sendResponse);
		}

		return true;
});

chrome.serial.onReceive.addListener(
	function(info){
		console.log(info);
		var portGUID = serialConnections[info.connectionId];
		serialPort[portGUID].postMessage({header: "serialdata", data: Array.prototype.slice.call(new Uint8Array(info.data))});
	}
);

// chrome.serial.onReceiveError.addListener(
// 	function(errorInfo){
// 		console.error("Connection " + errorInfo.connectionId + " has error " + errorInfo.error);
// 		var portGUID = serialConnections[errorInfo.connectionId];
// 		serialPort[portGUID].postMessage({header: "serialerror", error: errorInfo.error});
// 	}
// );

function openPort(request, sender, sendResponse){
	chrome.serial.connect(request.info.portName,
		{
		bitrate: request.info.bitrate,
		dataBits: request.info.dataBits,
		parityBit: request.info.parityBit,
		stopBits: request.info.stopBits
		},
		function(connectionInfo){
			if (chrome.runtime.lastError) {
				sendResponse({result: "error", error: chrome.runtime.lastError.message});
			}
			else{
				serialConnections[connectionInfo.connectionId] = request.portGUID;
				sendResponse({result:"ok", connectionInfo: connectionInfo});
			}
		}
	);
}

function closePort(request, sender, sendResponse){
	chrome.serial.disconnect(request.connectionId,
		function(connectionInfo){
			if (chrome.runtime.lastError) {
				sendResponse({result: "error", error: chrome.runtime.lastError.message});
			}
			else{
				serialConnections.slice(connectionInfo.connectionId, 1);
				sendResponse({result:"ok", connectionInfo: connectionInfo});
			}
		}
	);
}

function getPortList(request, sender, sendResponse){
	chrome.serial.getDevices(
		function(ports){
			if (chrome.runtime.lastError) {
				sendResponse({result: "error", error: chrome.runtime.lastError.message});
			}
			else{
				sendResponse({result:"ok", ports: ports});
			}
		}
	);
}

function writeOnPort(request, sender, sendResponse){
	chrome.serial.send(request.connectionId, new Uint8Array(request.data).buffer,
		function(response){
			if (chrome.runtime.lastError) {
				sendResponse({result: "error", error: chrome.runtime.lastError.message});
			}
			else{
				sendResponse({result:"ok", sendInfo: response});
			}
		}
	);
}

function checkInstalled(request, sender, sendResponse){
	var manifest = chrome.runtime.getManifest();
	sendResponse({result: "ok", version: manifest.version});
}

function getGUID() {
	function s4() {
  	return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}
