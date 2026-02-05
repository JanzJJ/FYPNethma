# 🚀 Complete Deployment Guide - Frontend & Backend

---

## 📋 Deployment Overview

Your project has **two parts** that need different hosting:

```
┌─────────────────────────────────────────────────────────┐
│  YOUR APPLICATION ARCHITECTURE                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Frontend (React/TypeScript)     Backend (Flask/Python)│
│  ├─ React components             ├─ AI Model          │
│  ├─ Pages & UI                   ├─ Image Analysis    │
│  ├─ Firebase Auth                ├─ Disease Detection │
│  └─ API calls to backend         └─ Predictions       │
│                                                         │
│  Host: Vercel ✅                 Host: Render/Railway  │
│  URL: https://staycare.vercel.app                      │
│  Deployed: Auto on git push      URL: https://your-backend.onrender.com
│                                  Deployed: Manual setup │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

# PART 1: FRONTEND DEPLOYMENT (Vercel)

## Status: 
✅ Already configured in earlier steps

## Quick Check - Is it already deployed?

1. **Go to vercel.com** and log in
2. **Check your projects dashboard**
3. **Look for your project** (staycare or similar)
4. **If it exists and built successfully** → Frontend is deployed ✓
5. **Get your frontend URL** (example: `https://staycare.vercel.app`)

If NOT deployed yet, follow these steps:

---

## Deploy Frontend to Vercel (If Not Done Yet)

### Step 1: Push All Code to GitHub
```bash
cd /Users/nethmajanz/Desktop/FYP\ Nethma
git add .
git commit -m "Ready for deployment"
git push origin master
```

### Step 2: Go to Vercel Dashboard
- Visit `vercel.com` and login
- Click "Add New" → "Project"
- Click "Import Git Repository"
- Select your GitHub repo

### Step 3: Configure Build Settings
```
Project Name: staycare
Framework: Vite
Root Directory: ./

Build Command:
cd frontend && npm install && npm run build

Output Directory:
frontend/dist
```

### Step 4: Add Environment Variables
```
VITE_FIREBASE_API_KEY = AIzaSyBpG_eZ0VA-iuiCeI07XvoCH5r0M3vfzck
VITE_FIREBASE_AUTH_DOMAIN = staycare-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID = staycare-app
VITE_FIREBASE_STORAGE_BUCKET = staycare-app.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID = 111885148
VITE_FIREBASE_APP_ID = 1:111885148:web:dd1f8ed329cff913fb9f99
VITE_GEMINI_API_KEY = your_gemini_key_here
VITE_BACKEND_URL = https://your-backend.onrender.com (UPDATE THIS AFTER BACKEND DEPLOYED)
```

### Step 5: Deploy
- Click "Deploy" button
- Wait 2-3 minutes
- ✅ Frontend is live!

### Step 6: Get Frontend URL
- After deployment completes
- Copy the URL (example: `https://staycare.vercel.app`)
- **Save this for later**

---

# PART 2: BACKEND DEPLOYMENT (Render.com)

## Recommended: Render.com (Free tier available)

### Why Render Instead of Vercel?
- Supports Python/Flask
- Can run long-running servers
- Free tier with 0.5GB RAM
- Easy deployment from GitHub

---

## Deploy Backend to Render

### Step 1: Create Render Account
1. Go to `render.com`
2. Click "Sign Up"
3. Sign up with GitHub (easiest)
4. Authorize Render to access GitHub

### Step 2: Create Web Service
1. Go to dashboard at `render.com/dashboard`
2. Click "New" → "Web Service"
3. Select your GitHub repository
4. Fill in details:

```
Repository: FYP- (your repo)
Branch: master
Name: staycare-backend
Environment: Python 3
Region: US East (or closest to you)
Build Command: pip install -r backend/requirements.txt
Start Command: cd backend && python app.py
```

### Step 3: Configure Environment & Resources
1. **Scroll to "Advanced"**
2. **Environment Variables**: Add if needed (skip for now)
3. **Instance Type**: Free (for testing)
4. Click **Create Web Service**

### Step 4: Wait for Deployment
- Render will:
  1. Clone your GitHub repo
  2. Install Python dependencies
  3. Start Flask server
  4. Take 5-10 minutes first time

- Watch the logs:
  ```
  Building...
  Installing requirements.txt...
  Starting Flask server...
  Running on http://...
  ```

- ✅ When you see "Running" → Backend is live!

### Step 5: Get Backend URL
1. Go back to Render dashboard
2. Click your web service
3. Look for "Service URL" (example: `https://staycare-backend.onrender.com`)
4. **Copy this URL**

---

# PART 3: CONNECT FRONTEND TO BACKEND

Now that both are deployed, connect them!

### Step 1: Update Frontend Environment Variable

1. **Go to Vercel dashboard**
2. **Select your project**
3. **Settings** → **Environment Variables**
4. **Edit** `VITE_BACKEND_URL`
5. **Change from:**
   ```
   http://localhost:5001
   ```
   **To:**
   ```
   https://your-backend.onrender.com
   ```
   (Use your actual Render URL)

6. Click **Save**

### Step 2: Redeploy Frontend

1. **In Vercel, go to "Deployments"**
2. **Find latest deployment**
3. **Click the three dots (...)**
4. **Click "Redeploy"**
5. **Wait 1-2 minutes**
6. **✅ Frontend now talks to backend!**

---

# PART 4: TEST EVERYTHING

## Test Frontend
1. Open your Vercel URL: `https://staycare.vercel.app`
2. Check if page loads (should see home page)
3. Try to login (should work)
4. ✅ Frontend working

## Test Backend
1. Open in browser: `https://your-backend.onrender.com/` (with your URL)
2. Should return HTML (index page)
3. ✅ Backend running

## Test Disease Detection (Full Flow)
1. Go to frontend
2. Navigate to "Disease Detection"
3. Upload a dog image
4. Click "Analyze"
5. Wait for result...
6. Should show disease name & care advice
7. ✅ Full integration working!

---

# TROUBLESHOOTING

## Frontend Shows Error
**Error:** "Failed to reach backend" or API calls fail

**Fix:**
1. Check `VITE_BACKEND_URL` in Vercel
2. Make sure it's the correct Render URL
3. Redeploy frontend
4. Check browser console (F12) for exact error

---

## Backend Not Responding
**Error:** "503 Service Unavailable" or "Connection refused"

**Fix:**
1. Go to Render dashboard
2. Check service is "Running" (not "Failed")
3. Check logs for errors
4. Common issues:
   - Model file missing (check it's in repo)
   - Dependencies not installed (check requirements.txt)
   - Port mismatch (should be 5001)

---

## CORS Errors
**Error:** "No 'Access-Control-Allow-Origin' header"

**Fix:** 
Your Flask already has CORS enabled, but verify in `backend/app.py`:
```python
from flask_cors import CORS
CORS(app)  # This allows all origins
```

---

## Model Loading Fails
**Error:** "Model file not found"

**Fix:**
1. Verify model file exists: `backend/model/dog_skin_disease_model.h5`
2. Push to GitHub (git add, commit, push)
3. Render will deploy the updated code
4. Restart service in Render dashboard

---

# DEPLOYMENT CHECKLIST

- [ ] Frontend pushed to GitHub
- [ ] Vercel project created & deployed
- [ ] Frontend URL obtained (https://staycare.vercel.app)
- [ ] Backend pushed to GitHub
- [ ] Render account created
- [ ] Render web service created
- [ ] Backend deployment completed (status: Running)
- [ ] Backend URL obtained (https://staycare-backend.onrender.com)
- [ ] `VITE_BACKEND_URL` updated in Vercel
- [ ] Frontend redeployed
- [ ] Frontend loads successfully
- [ ] Disease detection works (upload image → get results)
- [ ] All pages accessible (Home, Report, Adopt, Disease, Info)

---

# FINAL ARCHITECTURE

```
┌─────────────────────────────────────────────────────────┐
│           YOUR LIVE APPLICATION                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  User                                                   │
│   ↓                                                     │
│   └─→ Opens: https://staycare.vercel.app              │
│        (Frontend served by Vercel CDN - Fast!)         │
│        │                                               │
│        ├─ Firebase Auth                                │
│        │  └─→ Firebase Servers (Login)                │
│        │                                               │
│        └─ Upload Image for Analysis                    │
│           └─→ POST to: https://staycare-backend.onrender.com/predict
│               (Backend processes image)                │
│               ├─ Load AI model                         │
│               ├─ Analyze image                         │
│               └─ Return disease prediction             │
│               └─→ Display results to user              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

# SUMMARY

| Component | Hosted On | URL | Status |
|-----------|-----------|-----|--------|
| Frontend (React) | Vercel | `https://staycare.vercel.app` | Deployed |
| Backend (Flask) | Render | `https://staycare-backend.onrender.com` | To Deploy |
| Database | Firebase | - | Ready |
| AI Model | Backend | - | Embedded |

**You now have a fully deployed full-stack application!** 🎉

---

# NEXT STEPS

1. ✅ Make sure both are deployed
2. ✅ Test disease detection end-to-end
3. ✅ Share your deployed URL with others
4. 📱 Test on mobile
5. 🐛 Fix any bugs you find
6. 🚀 Keep improving!

For help: Check Render/Vercel logs or contact support

