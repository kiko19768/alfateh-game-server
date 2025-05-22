# Al-Fateh Game Server

This is the server for the Al-Fateh mobile game, a multiplayer RPG game inspired by "الفتح طريق الانتقام".

## Overview

The server is built with:
- Node.js and TypeScript
- WebSocket for real-time communication
- MongoDB Atlas for database

## Prerequisites

- Node.js 16+
- npm
- MongoDB Atlas account

## Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (or use the existing one):
```
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb+srv://meyoten4:1071998Kk@alfatth.fjmdexa.mongodb.net/?retryWrites=true&w=majority&appName=alfatth
DB_NAME=alfatth_game
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
```

4. Build the project:
```bash
npm run build
```

5. Start the server:
```bash
npm start
```

## Deployment

### Deploying to Render.com (Free)

1. Create an account on [Render.com](https://render.com)
2. Create a new Web Service
3. Connect to your GitHub/GitLab repository
4. Configure the deployment:
   - Environment: Node
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
5. Add environment variables from your `.env` file
6. Deploy!

Alternatively, use the deployment script:
```bash
./deploy-render.sh
```

### Deploying to Railway.app (Free)

1. Create an account on [Railway.app](https://railway.app)
2. Install the Railway CLI:
```bash
npm i -g @railway/cli
```
3. Login and initialize:
```bash
railway login
railway init
```
4. Deploy:
```bash
railway up
```

## Database Setup

The MongoDB database is already set up and ready to use. The connection string is included in the `.env` file.

Database details:
- Host: MongoDB Atlas (Cloud)
- Database Name: alfatth_game
- Collections:
  - players
  - characters
  - inventory

## Client Connection

Update the Android client's NetworkConfig.java file with the server URL:

```java
private static final String PROD_WS_URL = "wss://alfateh-game-server.onrender.com";
```

## Development

- Run in development mode:
```bash
npm run dev
```

- Lint and format code:
```bash
npm run lint
npm run format
```

## Testing the Connection

1. Use the `wscat` tool to test the WebSocket connection:
```bash
npm install -g wscat
wscat -c wss://alfateh-game-server.onrender.com
```

2. Send a test message:
```json
{"type":"login","data":{"username":"testuser","password":"password123"}}
```

## Troubleshooting

- If you can't connect to the server, check:
  - Server logs on Render.com dashboard
  - Your network connection
  - WebSocket URL format (wss:// for secure, ws:// for local)

- If database connection fails:
  - Check MongoDB Atlas status
  - Verify connection string
  - Check IP whitelist settings

## License

This project is proprietary software. All rights reserved.