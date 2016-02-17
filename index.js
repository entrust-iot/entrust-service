const fs = require("fs");
const mqtt = require("mqtt");
const request = require("request");
const Q = require("q");

const LOCALHOST = '127.0.0.1';
const SEC_DIR = __dirname + '/security';
const SECURE_CERT = SEC_DIR + '/service-client.crt';
const SECURE_KEY = SEC_DIR + '/service-client.key';
const SECURE_CA = SEC_DIR + '/service-ca.crt';

const METADATASERVER = {
    protocol: "https",
    hostname: "stark-shore-8953.herokuapp.com",
    port: "443",
    path: "/meta",
    devicePath: "/devices/",
    edgePath: "/edge/",
    initPath: "/init"
};

var _ = require('lodash');
var client = undefined;

// Create a client connection
connect();

function connect() {
  readSecureFiles().then(function(options) {
    client = mqtt.connect('mqtts://' + LOCALHOST, options);
    client.on('connect', connectHandler);
  }).done();
}

function readSecureFiles() {
  return Q.all([SECURE_CERT, SECURE_KEY, SECURE_CA]
    .map(function(path) {
      return Q.nfcall(fs.readFile, path);
    }))
  .spread(function (cert, key, ca) {
    return {
      cert: cert,
      key: key,
      ca: ca
    };
  });
};

function messageRouter(routes) {
  return function router(topic, message, packet) {
    console.log("Received '" + message + "' on '" + topic + "'");

    var route = _.find(routes, function(r) {
      var re = r.route;
      return re.test(topic);
    });

    console.log('route', route);
    if (route) {
      var msg = JSON.parse(message);
      route.fct(topic, msg, packet);
    }
  };
};

function connectHandler() { // When connected
  // subscribe to a topic
  client.subscribe("#", function() {
    // when a message arrives, do something with it

    var routesConfig = [
      { route: /edge/, fct: function() {} },
      { route: /init/, fct: handleInitRequest },
      { route: /agent_disconnected/, fct: handleAgentDisconnect },
      { route: /edge_disconnected/, fct: handleEdgeDisconnect },
      { route: /\w*\/.*?\//, fct: handleSensorData }
    ];

    client.on("message", messageRouter(routesConfig));
  });
};

function handleInitRequest(topic, message, packet) {
  console.log("Sending meta data");
  var initOptions = '/' + message.apiKey + '/' + message.mac + '/' + message.agentId + '/' + message.edgeId;

  var options = {
    uri: METADATASERVER.protocol + "://" + METADATASERVER.hostname + METADATASERVER.initPath + initOptions,
    method: 'GET',
    strictSSL: true
  };

  request(options, function (error, response, body) {

    var data = JSON.parse(body);
    data.agentId = message.agentId;
    client.publish("edge/" + message.edgeId, JSON.stringify(data));
  });
}

function handleAgentDisconnect(topic, message, packet) {
  console.log("Received Agent Disconnect");

  var postData = {
    'status': 'offline'
  };

  var options = {
    uri: METADATASERVER.protocol + "://" + METADATASERVER.hostname + METADATASERVER.devicePath + message.agentId,
    method: 'PUT',
    json: postData,
    strictSSL: true
  };

  request(options);
}

function handleEdgeDisconnect(topic, message, packet) {
  console.log("Received Agent Disconnect");

  var postData = {
    'status': 'offline'
  };

  var options = {
    uri: METADATASERVER.protocol + "://" + METADATASERVER.hostname + METADATASERVER.edgePath + message.edgeId,
    method: 'PUT',
    json: postData,
    strictSSL: true
  };

  request(options);
}

function handleSensorData(topic, message, packet) {
  console.log("Sending meta data");
  var postData = {
    "type" : packet.cmd,
    "length": packet.length,
    "topic": packet.topic
  };

  var options = {
    uri: METADATASERVER.protocol + "://" + METADATASERVER.hostname + METADATASERVER.path,
    method: 'POST',
    json: postData,
    strictSSL: true
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
    json: {},
    strictSSL: true
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
