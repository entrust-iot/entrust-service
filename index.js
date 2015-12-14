var mqtt = require("mqtt");
// Parse

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
        });
    });

});