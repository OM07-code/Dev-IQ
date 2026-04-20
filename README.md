# 🚀 DevIQ - Professional Technical Interview Platform

DevIQ is a high-performance, real-time technical interview platform designed to mirror the experience of top-tier engineering interviews. It features a LeetCode-inspired 3-column workspace, integrated video/chat, and a backend-native code execution engine.

![DevIQ Demo](https://raw.githubusercontent.com/OM07-code/Dev-IQ/main/frontend/public/screenshot-for-readme.png)

## ✨ Core Features

- **LeetCode-Style Workspace**: A professional 3-column layout (Video | Problem/Notes/Whiteboard | Code/Terminal) with resizable panels.
- **Multi-Problem Sessions**: Interviewers can dynamically inject multiple problems into an ongoing session and switch between them instantly.
- **Backend-Native Code Execution**: High-speed, secure code execution for Javascript, Python, and Java powered by a custom backend runner.
- **Collaborative Whiteboard**: Synchronized sketching area for system design and architectural discussions.
- **Interviewer Toolkit**:
  - **Private Notes**: Host-only persistent note-taking panel.
  - **Problem Switcher**: Force-sync the candidate to specific problems.
  - **Code Snapshots**: Automatically saves the final state of all problems upon session termination.
- **Real-Time Synergy**:
  - Synchronized Code Editor with language-aware syntax highlighting.
  - Low-latency Video & Audio calls via Stream SDK.
  - Integrated Session Chat.
- **Custom JWT Auth**: Secure, self-contained authentication system (no external identity provider required).

---

## 🧪 Environment Configuration

### Backend (`/backend`)
Create a `.env` file with:
```bash
PORT=3000
NODE_ENV=development
DB_URL=your_mongodb_connection_url
JWT_SECRET=your_secure_random_key

STREAM_API_KEY=your_stream_api_key
STREAM_API_SECRET=your_stream_api_secret

CLIENT_URL=http://localhost:5173
```

### Frontend (`/frontend`)
Create a `.env` file with:
```bash
VITE_API_URL=http://localhost:3000/api
VITE_STREAM_API_KEY=your_stream_api_key
```

---

## 🔧 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/OM07-code/Dev-IQ.git
   cd Dev-IQ
   ```

2. **Start Backend**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

3. **Start Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## 🛠️ Tech Stack

- **Frontend**: React, TailwindCSS, DaisyUI, Monaco Editor, React Query, Socket.io-client.
- **Backend**: Node.js, Express, MongoDB, Socket.io, JWT.
- **Real-time**: GetStream.io (Video & Chat), WebSockets.
- **Infrastructure**: Custom isolated code execution runner.

---

## 🔒 Security
DevIQ executes user code in a controlled backend environment. For production deployments, it is recommended to wrap the backend execution in a Dockerized sandbox or use a restricted user profile.
