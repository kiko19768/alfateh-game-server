#!/bin/bash

# Test build and connection script

# Colors for better readability
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Testing build and connection to MongoDB...${NC}"

# Step 1: Build the project
echo -e "${YELLOW}Building the TypeScript project...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed. Please fix the errors above.${NC}"
    exit 1
else
    echo -e "${GREEN}Build successful!${NC}"
fi

# Step 2: Test MongoDB connection
echo -e "${YELLOW}Testing MongoDB connection...${NC}"
npm run test:db

if [ $? -ne 0 ]; then
    echo -e "${RED}MongoDB connection test failed.${NC}"
    exit 1
else
    echo -e "${GREEN}MongoDB connection test successful!${NC}"
fi

# Step 3: Initialize database (optional)
read -p "Do you want to initialize the database? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Initializing database...${NC}"
    npm run db init
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Database initialization failed.${NC}"
        exit 1
    else
        echo -e "${GREEN}Database initialized successfully!${NC}"
    fi
fi

echo -e "${GREEN}All tests passed! Your server is ready to be deployed.${NC}"
echo -e "${YELLOW}You can deploy to Render.com using the render.yaml configuration.${NC}"