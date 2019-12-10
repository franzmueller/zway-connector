Modules.include("mqtt");

Modules.registerModule("connector", function (module) {
    return {
        connect: function (url, hubId, user, password, then, error) {
            var result = {
                _connection: null,
                _commandHandlers: {},
                disconnect: function(){
                    throw "not implemented"
                },
                //handler = function(deviceLocalId string, serviceLocalId string, message map[string]string) => responseMessage map[string]string
                registerCommand: function (deviceLocalId, serviceLocalId, handler) {
                    throw "not implemented"
                },
                sendEvent: function (deviceLocalId, serviceLocalId, message) {
                    throw "not implemented"
                }
            };

            result.disconnect = function(){
                try{
                    if(result._connection){
                        result._connection.disconnect();
                    }
                    result._connection = null;
                    result._commandHandlers = {};
                }catch (e) {
                    console.log("ERROR: while disconnecting connector", e, e.stack)
                }
            };

            //handler = function(deviceLocalId string, serviceLocalId string, message map[string]string) => responseMessage map[string]string
            result.registerCommand = function(deviceLocalId, serviceLocalId, handler){
                try{
                    if(!result._commandHandlers[deviceLocalId]){
                        result._commandHandlers[deviceLocalId] = {};
                    }
                    result._commandHandlers[deviceLocalId][serviceLocalId] = handler;
                    var err = result._connection.subscribe("command/"+deviceLocalId+"/"+serviceLocalId);
                    if(err.err){
                        console.log("ERROR: unable to subscribe to command", e, e.message, JSON.stringify(e), deviceLocalId, serviceLocalId);
                        return {err: err.err}
                    }
                }catch (e) {
                    console.log("ERROR: unable to register command", e, e.message, JSON.stringify(e), deviceLocalId, serviceLocalId);
                    return {err: "error: "+e.message}
                }
                return {}
            };

            //request = {"correlation_id":"","payload":{"segment":"string"},"timestamp":0,"completion_strategy":""}
            //response = {"segment":"string"}
            result._respond = function(deviceLocalId, serviceLocalId, request, response){
                try{
                    //{"correlation_id":"","payload":{"segment":"string"}}
                    var err = result._connection.send("response/"+deviceLocalId+"/"+serviceLocalId, JSON.stringify({correlation_id:request.correlation_id, payload:{data: JSON.stringify(response)}}));
                    if(err.err){
                        console.log("ERROR: while sending response", err.err, err.err.message, JSON.stringify(err.err), deviceLocalId, serviceLocalId);
                    }
                }catch (e) {
                    console.log("ERROR: unable to send response", e, e.message, JSON.stringify(e), deviceLocalId, serviceLocalId);
                }
            };

            //message = {"segment":"string"}
            result.sendEvent = function(deviceLocalId, serviceLocalId, message){
                try{
                    //{"correlation_id":"","payload":{"segment":"string"}}
                    console.log("send event: ", deviceLocalId, serviceLocalId, JSON.stringify({data: JSON.stringify(message)}));
                    var err = result._connection.send("event/"+deviceLocalId+"/"+serviceLocalId, JSON.stringify(message));
                    if(err.err){
                        console.log("ERROR: while sending event", err.err, err.err.message, JSON.stringify(err.err), deviceLocalId, serviceLocalId);
                        return {err: err.err}
                    }
                }catch (e) {
                    console.log("ERROR: unable to send event", e, e.message, JSON.stringify(e), deviceLocalId, serviceLocalId);
                    return {err: "error: "+e.message}
                }
                return {}
            };

            //payload = {"correlation_id":"","payload":{"segment":"string"},"timestamp":0,"completion_strategy":""}
            result._handleCommand = function(topic, payload){
                try {
                    var topicParts = topic.split("/");
                    var deviceLocalId = topicParts[1];
                    var serviceLocalId = topicParts[2];
                    var request = JSON.parse(payload);
                    if(!result._commandHandlers[deviceLocalId] || !result._commandHandlers[deviceLocalId][serviceLocalId]){
                        console.log("command not registered:", deviceLocalId, serviceLocalId);
                        return
                    }
                    var response = result._commandHandlers[deviceLocalId][serviceLocalId](deviceLocalId, serviceLocalId, JSON.parse(request.payload.data));
                    result._respond(deviceLocalId, serviceLocalId, request, response);
                }catch (e) {
                    console.log("ERROR: unable to handle command", e, e.message, JSON.stringify(e), topic, payload)
                }
            };

            result._connection = Modules.get("mqtt").connect(
                url,
                hubId,
                user,
                password,
                true,
                function (connection, err) {
                    console.log("CONNECTOR DISCONNECTED");
                    error()
                }, function (connection) {
                    console.log("CONNECTOR CONNECTED");
                    then();
                }, function (connection, err) {
                    console.log("CONNECTOR ERROR");
                    error();
                }, function(connection, topic, payload){
                    result._handleCommand(topic, payload);
                }
            );
            if(result._connection.err){
                console.log("ERROR: unable to connect", result._connection.err);
                error();
                return {err: result._connection.err}
            }

            return result;
        }
    };

});
