# Vibebin Deployment Guide

## ⚠️ Important Architecture Note
The **Server** uses `socket.io` for real-time features. This means it **cannot** be deployed to standard Serverless platforms (like Vercel functions, AWS Lambda, or Netlify functions) because they do not support persistent WebSocket connections.

**Recommended Production Architecture:**
- **Frontend** → **Vercel** (Best for Vite/React)
- **Backend** → **Render**, **Railway**, or **Heroku** (platforms that support long-running Node.js/WebSocket processes).

---

## Part 1: Deploy Backend (Render)

Render is recommended as it has a generous free tier that supports WebSockets.

1.  **Push your code to GitHub**. Ensure your repository contains both `client` and `server` folders.
2.  Go to [Render Dashboard](https://dashboard.render.com).
3.  Click **New +** → **Web Service**.
4.  Connect your GitHub repository.
5.  **Configuration**:
    -   **Name**: `vibbin-server` (or similar)
    -   **Root Directory**: `server`
    -   **Environment**: Node
    -   **Build Command**: `npm install && npm run build` (or just `npm install` if using `ts-node` in start, but we added a build script)
    -   **Start Command**: `npm start`
    -   **Plan**: Free
6.  **Environment Variables** (Add these in the "Environment" tab):
    -   `DATABASE_URL`: Your Supabase PostgreSQL URL (same as `.env`).
    -   `JWT_SECRET`: Any long secure string.
    -   `PORT`: `5000` (Render handles this internally but good to set).
    -   `NODE_ENV`: `production`

7.  Click **Deploy Web Service**.
8.  **Wait for deployment**. Once green, copy your backend URL (e.g., `https://vibbin-server.onrender.com`).

---

## Part 2: Deploy Frontend (Vercel)

1.  Go to [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **Add New...** → **Project**.
3.  Import your GitHub repository.
4.  **Configuration**:
    -   **Framework Preset**: Vite
    -   **Root Directory**: Click "Edit" and select `client`.
5.  **Environment Variables**:
    -   Name: `VITE_API_URL`
    -   Value: `https://your-backend-name.onrender.com` (The URL you got from Part 1, **without** the trailing slash).
6.  Click **Deploy**.

---

## Part 3: Final Connection

1.  Once Vercel gives you the frontend URL (e.g., `https://vibbin.vercel.app`), go back to your **server** code.
2.  You need to update strict CORS policy if enabled.
3.  In `server/src/index.ts`, ensure `cors` allows your Vercel domain. Currently, it is set to `origin: '*'` which allows everything (easiest for testing but less secure). For production, you might want to restrict it later.

**Done!** Your Vibebin app is now live with real-time features.
