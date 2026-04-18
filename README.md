# FrameShift 🎨

A modern, highly interactive web application for sharing, curating, and discovering digital posters and visual art. Built with React, TypeScript, Vite, and Firebase.

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Firebase](https://img.shields.io/badge/firebase-%23039BE5.svg?style=for-the-badge&logo=firebase)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-black?style=for-the-badge&logo=framer&logoColor=blue)

## ✨ Features

* **Secure Authentication**: Google Sign-In powered by Firebase Auth.
* **Interactive Uploads**: Upload posters, create stories, and edit images with custom layouts (full, frame, split).
* **Dynamic Profiles**: Manage your uploaded posters, curate custom collections, and track your likes.
* **Fluid Animations**: High-performance, buttery-smooth UI transitions using Framer Motion and GSAP.
* **Real-time Database**: Instant updates for likes, messages, and feed content using Cloud Firestore.
* **Fully Responsive**: Optimized for both desktop and mobile viewing experiences.

## 🛠️ Tech Stack

* **Frontend**: React 19, TypeScript, Vite
* **Styling**: Tailwind CSS, `clsx`, `tailwind-merge`
* **Animations**: Framer Motion, GSAP
* **Backend/BaaS**: Firebase (Authentication, Firestore Database, Cloud Storage)
* **Icons**: Lucide React
* **Routing**: React Router v7

## 🚀 Local Development Setup

### Prerequisites
* Node.js (v18 or higher recommended)
* npm or yarn
* A Firebase Project

### 1. Clone the repository
```bash
git clone https://github.com/demon2202/FrameShift.git
cd FrameShift
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory of the project and add your Firebase configuration keys:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
VITE_FIRESTORE_DATABASE_ID=your_database_id
```

### 4. Start the development server
```bash
npm run dev
```
The app will be running at `http://localhost:5173` (or `http://localhost:3000`).

> **Note:** Make sure to add `localhost` or `127.0.0.1` to your Firebase Authentication **Authorized Domains** settings to allow local logins.

## 🌍 Deployment (Vercel)

This project is optimized for deployment on [Vercel](https://vercel.com).

1. Push your code to GitHub.
2. Import the repository into Vercel.
3. In the Vercel project settings, go to **Environment Variables** and add all the `VITE_FIREBASE_*` keys from your `.env` file.
4. Deploy the project.
5. **Crucial:** Copy your new Vercel domain (e.g., `frameshift.vercel.app`) and add it to your **Authorized Domains** in the Firebase Authentication console.

*Note: The repository includes a `vercel.json` file to ensure React Router handles client-side routing correctly without throwing 404 errors on page refresh.*

## 📜 Scripts

* `npm run dev` - Starts the local development server.
* `npm run build` - Compiles TypeScript and builds the app for production.
* `npm run lint` - Runs ESLint to check for code quality issues.
* `npm run preview` - Previews the production build locally.

## 📄 License

This project is open-source and available under the MIT License.
