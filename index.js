var mqtt = require("mqtt");
var request = require("request");

var METADATASERVER = {
    hostname: "stark-shore-8953.herokuapp.com",
    port: "80",
    path: "/meta"
};

// Create a client connection
var client = mqtt.createClient(1883, "127.0.0.1", {
    username: "",
    password: ""
});

client.on('connect', function() { // When connected

    // subscribe to a topic
    client.subscribe("#", function() {
        // when a message arrives, do something with it
        client.on("message", function(topic, message, packet) {
            console.log("Received '" + message + "' on '" + topic + "'");
            console.log("Packet: " + packet);
            console.log(packet);
            sendDataToMetaDataServer(packet)
        });
    });

});

function sendDataToMetaDataServer(packet) {
    console.log("Sending meta data");
    var postData = JSON.stringify({
        'type' : packet.cmd,
        'length': packet.length,
        'topic': packet.topic
    });

    var options = {
        uri: METADATASERVER.hostname + METADATASERVER.path,
        method: 'POST',
        json: postData
    };

    request(options, function (error, response, body) {
        console.log("Response from metadata server");
        console.log(response);
        if (error) {
            console.log(error);
        }
        if (!error && response.statusCode == 200) {
            console.log(body);
        }
    });
}

function sendDataToEnterpriseHub() {

}