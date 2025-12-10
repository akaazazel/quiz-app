# Quiz App

A full-stack Quiz Application featuring a comprehensive Admin Dashboard and a robust Student Quiz Interface. Built with React (Vite), Express, and Supabase.

## Features

### 🎓 Student Portal
- **Secure Access**: Unique, one-time-use links for every student.
- **Welcome Interface**: Clear instructions and rules before starting.
- **Timed Questions**: Strict time limits per question.
- **Scoring**: Points awarded for correct answers + speed bonuses.
- **Security**: Prevents re-entry after submission.

### 🛡️ Admin Dashboard
- **Authentication**: Password-protected access.
- **Quiz Management**: Upload questions via JSON.
- **Student Management**: Bulk upload students via CSV to generate unique links.
- **Monitoring**: Real-time table showing student status (Pending/Submitted) and scores.
- **Data Control**: Factory reset option to clear all data.
- **Export**: Download results and generated links as CSV.

## Tech Stack
- **Frontend**: React, Vite, Vanilla CSS (Geist Design System).
- **Backend**: Node.js, Express (Serverless-ready).
- **Database**: Supabase (PostgreSQL).
- **Hosting**: Vercel.

## Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd quiz-app
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ADMIN_PASSWORD=your_secure_password
   ```

4. **Run Locally**
   You need to run both the frontend and backend servers.
   ```bash
   # Terminal 1: Backend (http://localhost:3000)
   npm run api

   # Terminal 2: Frontend (http://localhost:5173)
   npm run dev
   ```

## Deployment (Vercel)

This project is configured for Vercel deployment out of the box.

1. **Deploy via CLI**
   ```bash
   npx vercel
   ```

2. **Configure Environment**
   Go to your Vercel Project Settings -> Environment Variables and add:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_PASSWORD`

3. **Redeploy**
   ```bash
   npx vercel --prod
   ```

## API Utils
- **POST /api/admin/questions**: Upload JSON quiz structure.
- **POST /api/admin/students**: Upload CSV student list.
- **GET /api/admin/students**: Fetch student progress.
- **DELETE /api/admin/reset**: Wipe database.
