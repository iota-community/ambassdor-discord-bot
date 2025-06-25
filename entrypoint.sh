#!/bin/bash

# Deploy slash commands
echo "Deploying commands..."
node deploy-commands.js

# Start the bot
echo "Starting the bot..."
node index.js

