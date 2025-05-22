#!/bin/bash

# This script deploys the game server to Render.com

# Color codes for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting deployment to Render.com...${NC}"

# 1. Build the project
echo -e "${YELLOW}Building TypeScript project...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed. Aborting deployment.${NC}"
    exit 1
fi

echo -e "${GREEN}Build successful!${NC}"

# 2. Create .env file for Render
echo -e "${YELLOW}Creating .env file for Render...${NC}"
cat > .env << EOL
PORT=3000
NODE_ENV=production
MONGODB_URI=mongodb+srv://meyoten4:1071998Kk@alfatth.fjmdexa.mongodb.net/?retryWrites=true&w=majority&appName=alfatth
DB_NAME=alfatth_game
JWT_SECRET=alfatth-game-secret-key-change-in-production
JWT_EXPIRES_IN=7d
MAX_PLAYERS_PER_INSTANCE=100
SAVE_INTERVAL=300000
EOL

echo -e "${GREEN}.env file created!${NC}"

# 3. Initialize git if not already initialized
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}Initializing git repository...${NC}"
    git init
    git add .
    git commit -m "Initial commit for deployment"
else
    echo -e "${YELLOW}Git repository already initialized.${NC}"
    git add .
    git commit -m "Deployment update"
fi

# 4. Deploy to Render
echo -e "${YELLOW}Deploying to Render.com...${NC}"
echo -e "${YELLOW}To deploy to Render.com, follow these steps:${NC}"
echo -e "${GREEN}1. Go to https://dashboard.render.com/new/web-service${NC}"
echo -e "${GREEN}2. Connect your GitHub or GitLab repository${NC}"
echo -e "${GREEN}3. Select the repository and branch${NC}"
echo -e "${GREEN}4. Configure as follows:${NC}"
echo -e "   - Name: alfateh-game-server"
echo -e "   - Environment: Node"
echo -e "   - Build Command: npm install && npm run build"
echo -e "   - Start Command: npm start"
echo -e "${GREEN}5. Add the environment variables from the .env file${NC}"
echo -e "${GREEN}6. Click 'Create Web Service'${NC}"

echo -e "${YELLOW}Alternatively, you can use the Render CLI if you have it installed:${NC}"
echo -e "${GREEN}render deploy${NC}"

echo -e "${GREEN}Deployment process complete!${NC}"
echo -e "${YELLOW}Your server will be available at: https://alfateh-game-server.onrender.com${NC}"
echo -e "${YELLOW}Make sure to update the client's NetworkConfig.java file with this URL.${NC}"