/* 
 * class convetsation info 
 */


var connInfo = function () {
}
connInfo.connectionStart = new Date();
connInfo.sender = '';
connInfo.receiver = ''
connInfo.connInfoofferSend = '';
connInfo.offerRereceived = '';
connInfo.answerSend = '';
connInfo.answerReceived = '';
connInfo.connectionClose = '';
connInfo.duration = 0;
connInfo.headers = '';
connInfo.data;

connInfo.handleEvents = function (event, data) {
    switch (event) {
        case 'sdp-offer':
            offerSend = new Date();
            receiver = data.toId;
            break;
        case 'sdp-answer':
            answerSend = new Date();
            break;
    }
}

connInfo.durationTime = function ()
{
}
connInfo.getProps = function(obj, objName) {
  var result = {};
  for (var i in obj) {
    if (obj.hasOwnProperty(i)) {
      if (typeof obj[i]!== 'function')  
      result[i] = obj[i];
    }
  }
  return result;
}

exports.ConnectionInfo = connInfo;