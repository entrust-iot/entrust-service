var mqtt = require("mqtt");
var http = require("http");

var METADATASERVER = {
    hostname: "stark-shore-8953.herokuapp.com",
    port: "80"
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
        hostname: METADATASERVER.hostname,
        port: METADATASERVER.port,
        path: '/meta',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': postData.length
        }
    };

    var req = http.request(options, function(res) {
        res.on('data', function (chunk) {
            console.log('BODY: ' + chunk);
        });
        res.on('end', function() {
            console.log('No more data in response.')
        });
        res.on("success", function(data) {
            console.log(data);
        });
    });
}

function sendDataToEnterpriseHub() {

}