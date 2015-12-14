Heroku URL: http://lit-eyrie-4329.herokuapp.com
Azure URL: http://entrust-service.cloudapp.net

On Azure
ssh into a Ubuntu VM

Install Mosquitto
sudo apt-add-repository ppa:mosquitto-dev/mosquitto-ppa
sudo apt-get update
sudo apt-get install mosquitto

Install NodeJs
curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
sudo apt-get install -y nodejs