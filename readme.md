Azure URL: http://entrust-service.cloudapp.net

On Azure
- ssh into a Ubuntu VM

Install Mosquitto
- `sudo apt-add-repository ppa:mosquitto-dev/mosquitto-ppa`
- `sudo apt-get update`
- `sudo apt-get install mosquitto`

Install NodeJs
- `curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -`
- `sudo apt-get install -y nodejs`

Install Git
- `sudo apt-get install git`

Clone the repo
- `git clone https://github.com/entrust-iot/entrust-service`

Details & API
The node server runs both a MQTT listener that is subscribed to the root and will take care of sending the requests
to the Metadata server and the Enterprise Hub.

MQTT.on#message
The message should be sent to the topic
`/{tenant_id}/{device_id}/{sensor_id}`
Payload should be

    {
     "value": 123 //Value of the sensor
    }
As part of this POC, we only accept number values for the sensor

When the message is received, a request is sent to the metadata server to keep the information for invoicing and the
metadata server sends back a response with the enterprise hub address so we can push the actual data to the enterprise
hub for visualization.
