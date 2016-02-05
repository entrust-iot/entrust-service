var mqtt = require("mqtt");
var request = require("request");

var METADATASERVER = {
    protocol: "http",
    hostname: "stark-shore-8953.herokuapp.com",
    port: "80",
    path: "/meta",
    initPath: "/init"
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

            var msg = JSON.parse(message);
            console.log(topic);

            if (topic.indexOf('edge') === 0) {
              // discard any messages published for the edges..
              return;
            } else if (topic === 'init') {
              handleInitRequest(msg);
            } else {
              sendDataToMetaDataServer(msg, packet);
            }
        });
    });

});

function handleInitRequest(message) {
  var initOptions = '/' + message.apiKey + '/' + message.mac;

  var options = {
      uri: METADATASERVER.protocol + "://" + METADATASERVER.hostname + METADATASERVER.initPath + initOptions,
      method: 'GET'
  };

  request(options, function (error, response, body) {
    console.log('received tenant')

    var data = JSON.parse(body);
    data.agentId = message.agentId;

    console.log('data',data);

    client.publish("edge/" + message.edgeId, JSON.stringify(data));
  });
}

function sendDataToMetaDataServer(message, packet) {
    console.log("Sending meta data");
    var postData = {
        "type" : packet.cmd,
        "length": packet.length,
        "topic": packet.topic
    };

    var options = {
        uri: METADATASERVER.protocol + "://" + METADATASERVER.hostname + METADATASERVER.path,
        method: 'POST',
        json: postData
    };

    request(options, function (error, response, body) {
        console.log("Response from metadata server");
        if (error) {
            console.log("ERROR");
            console.log(error);
        }
        if (!error && response.statusCode == 200) {
            console.log("Response received from metadata server");
            console.log(body);
            console.log("Sending data to enterprise hub");
            console.log(message);

            if (typeof message !== "object") {
                message = JSON.parse(message);
            }

            sendDataToEnterpriseHub(message, packet, body);
        }
        if (!error && response.statusCode !== 200) {
            console.log("Unexpected response from server");
            console.log(body);
        }
    });
}

function sendDataToEnterpriseHub(message, packet, metadataServerResponse) {
    console.log("Sending hub data");
    console.log(message);

    if (!metadataServerResponse.tenant_data.protocol || !metadataServerResponse.tenant_data.hostname) {
        console.log("No valid EDH found, exiting...");
        return;
    }
    //Topic should contain /TENANT_ID/DEVICE_ID/SENSOR_ID
    //var packet = {topic: "/TENANT1/j2jj41j2k4j124-12k1j24/sensor2"};

    if (packet.topic.substr(0,1) === "/") {
        packet.topic = packet.topic.substr(1);
    }

    if (typeof message === "object" && message.value) {
        message = message.value;
    }

    var topicData = packet.topic.split("/");
    var deviceId = topicData[1];
    var sensorId = topicData[2];
    var baseUrl = metadataServerResponse.tenant_data.protocol + "://" + metadataServerResponse.tenant_data.hostname + "/";
    var options = {
        uri: baseUrl + deviceId + "/" + sensorId + "/" + message,
        method: 'POST',
        json: {}
    };

    request(options, function (error, response, body) {
        console.log("Response from enterprise hub server");
        if (error) {
            console.log("ERROR");
            console.log(error);
            return;
        }
        if (response.statusCode == 200) {
            console.log("Sucessfully sent data to metadata server and enterprise hub");
        } else {
            console.log("Unexpected response");
            console.log(response);
        }
    });
}
