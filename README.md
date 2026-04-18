# ChatSphere — Real-Time Group Chat Frontend

White & Blue themed React frontend for the group chat backend.

## Quick Setup

```bash
# 1. Install dependencies
npm install

# 2. Create your .env file
cp .env.example .env
# Edit .env and set your backend URLs

# 3. Start the app
npm start
```

## Environment Variables

```
REACT_APP_API_URL=http://localhost:5000/api/v1
REACT_APP_SOCKET_URL=http://localhost:5000
```

## Features

- JWT Authentication (Register / Login)
- Create, Join, Leave Groups
- Real-time messaging via Socket.io
- Typing indicators (live)
- Online/Offline user status
- Message read receipts (✓ / ✓✓)
- Load previous messages on join
- Member list panel
- Group discovery page
- White & Blue theme

## File Structure

```
src/
  context/AuthContext.js     — JWT auth state
  hooks/useSocket.js         — Socket.io hook
  utils/api.js               — Axios API calls
  pages/
    AuthPage.js              — Login / Register
    HomePage.js              — Main layout
  components/
    Sidebar.js               — Group list + discovery
    ChatWindow.js            — Chat UI + socket events
    ProtectedRoute.js        — Auth guard
```

## API Endpoints Used

- POST /api/auth/register
- POST /api/auth/login
- GET  /api/groups           (all groups - discover)
- GET  /api/groups/my        (joined groups)
- POST /api/groups           (create group)
- POST /api/groups/:id/join
- POST /api/groups/:id/leave
- GET  /api/groups/:id/messages

## Socket Events

| Emit            | Description                  |
|-----------------|------------------------------|
| joinGroup       | Join a room + load history   |
| sendMessage     | Send a message               |
| typing          | Typing indicator             |
| getOnlineUsers  | Fetch online users           |

| Listen          | Description                  |
|-----------------|------------------------------|
| previousMessages| Load history on room join    |
| receiveMessage  | New incoming message         |
| userTyping      | Someone is typing            |
| onlineUsers     | List of online users         |
| userJoined      | Someone joined the room      |
