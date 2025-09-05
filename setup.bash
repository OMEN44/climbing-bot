sudo apt update
sudo apt upgrade -y

sudo apt install git curl -y

# Install node
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash

source ~/.bashrc

nvm install node

npm install -g corepack
