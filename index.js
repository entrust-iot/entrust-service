var mqtt = require("mqtt");
var http = require("http");
var querystring = require("querystring");

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
            sendDataToMetaDataServer(topic, message)
        });
    });

});

function sendDataToMetaDataServer() {
    var postData = querystring.stringify({
        'msg' : 'Hello World!'
    });

    var options = {
        hostname: METADATASERVER.hostname,
        port: METADATASERVER.port,
        path: '/meta',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': postData.length
        }
    };

    //var req = http.request(options, function(res) {
    //    console.log('STATUS: ' + res.statusCode);
    //    console.log('HEADERS: ' + JSON.stringify(res.headers));
    //    res.setEncoding('utf8');
    //    res.on('data', function (chunk) {
    //        console.log('BODY: ' + chunk);
    //    });
    //    res.on('end', function() {
    //        console.log('No more data in response.')
    //    })
    //});
}

function sendDataToEnterpriseHub() {

}