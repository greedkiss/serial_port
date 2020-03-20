var extensionId;

chrome.storage.local.get('channels', function (result) {
        channels = result.id;
        console.log(result.channels, 1111);
        $("#channels").val(channels);
 });

// chrome.runtime.sendMessage({greeting: "id"}, function(response) {
//   console.log(response.id, 2121221);
//   extensionId = response.id;
// });

function SerialPort(){

  var portGUID;

  var port = chrome.runtime.connect(extensionId);

  var serialConnectionId;

  var isSerialPortOpen = false;

  var onDataReceivedCallback = undefined;

  var onErrorReceivedCallback = undefined;

  port.onMessage.addListener(
    function(msg) {
      // console.log(msg);
      if(msg.header === "guid"){
        portGUID = msg.guid;
      }
      else if(msg.header === "serialdata"){
        if(onDataReceivedCallback !== undefined){
          onDataReceivedCallback(new Uint8Array(msg.data).buffer);
        }
      }
      else if(msg.header === "serialerror"){
        onErrorReceivedCallback(msg.error);
      }
    }
  );

  this.isOpen = function(){
  	return isSerialPortOpen;
  }

  this.setOnDataReceivedCallback = function(callBack){
    onDataReceivedCallback = callBack;
  }

  this.setOnErrorReceivedCallback = function(callBack){
    onErrorReceivedCallback = callBack;
  }

  this.openPort = function(portInfo, callBack){
    chrome.runtime.sendMessage(extensionId,
      {
        cmd: "open",
        portGUID: portGUID,
        info: portInfo
      },
      function(response){
        if(response.result === "ok"){
          isSerialPortOpen = true;
          serialConnectionId = response.connectionInfo.connectionId;
        }
        callBack(response);
      }
    );
  }

  this.closePort = function(callBack){
    chrome.runtime.sendMessage(extensionId,
      {
        cmd: "close",
        connectionId: serialConnectionId
      },
      function(response){
          if(response.result === "ok"){
            isSerialPortOpen = false;
          }
          callBack(response);
      }
    );
  }

  this.write = function(data, callBack){
    chrome.runtime.sendMessage(extensionId,
      {
        cmd: "write",
        connectionId: serialConnectionId,
        data: Array.prototype.slice.call(new Uint8Array(data))
      },
      function(response){
        if(response.result === "ok"){
          if(response.sendInfo.error !== undefined){
            if(response.sendInfo.error === "disconnected" || response.sendInfo.error === "system_error"){
              isSerialPortOpen = false;
              closePort(function(){});
            }
          }
        }
        callBack(response);
      }
    );
  }
}

function getDevicesList(callBack){
  chrome.runtime.sendMessage(extensionId, {cmd: "list"}, callBack);
}

function isExtensionInstalled(callback){
   chrome.runtime.sendMessage(extensionId, { cmd: "installed" },
     function (response) {
       if (response){
        callback(true);
      }else{
        callback(false);
      }
    }
  );
}
