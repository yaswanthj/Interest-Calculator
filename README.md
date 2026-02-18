
# 💰 వడ్డీ లెక్కలు (Local Setup Guide)

Follow these steps to run the app on your computer using **Node.js 16**.

## 🛠 Step 1: Verify Node Version
The error `Unexpected token {` usually means your terminal is using an older version of Node (like v10 or v12) instead of v16. Check it now:
```bash
node -v
```
It **must** show at least `v16.14.0`.

## 📦 Step 2: Refresh Installation
Since the previous installation failed, it's best to clear the cache:
1. Delete the `node_modules` folder.
2. Delete `package-lock.json`.
3. Run:
```bash
npm install
```

## 🚀 Step 3: Run Locally
Run this command:
```bash
npm run dev
```
The app will now start at `http://localhost:3000` using Vite 3, which is fully compatible with Node 16.

## 📱 Step 4: Building for Mobile (APK)
1. Run `npm run build`.
2. This creates a `dist` folder.
3. Upload this folder to your host or use it in **PWABuilder.com**.

---
Developed by **VS APPS**
