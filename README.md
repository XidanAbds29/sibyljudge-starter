# SibylJudge Starter

SibylJudge is a full-stack online judge and competitive programming platform inspired by VJudge, Codeforces, and AtCoder. It allows users to solve problems, participate in contests, join groups, and discuss solutions. This starter project provides a robust backend and a modern frontend for rapid development and customization.

## Features

- **User Authentication**: Secure login and registration using Supabase.
- **Problem Archive**: Browse, filter, and solve programming problems from multiple online judges.
- **Contests**: Create, join, and participate in programming contests.
- **Groups**: Form study groups, share problems, and compete together.
- **Discussion Forum**: Start threads, reply, and discuss problems or contests.
- **Badges & Profiles**: Earn badges, view user stats, and update your profile.
- **Real-time Updates**: Live standings, notifications, and chat features.
- **Admin Tools**: Manage problems, contests, and users.

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: Node.js, Express, Supabase (PostgreSQL)
- **Database**: Supabase/PostgreSQL
- **Authentication**: Supabase Auth

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn
- Supabase account (for database and auth)

### Setup
1. **Clone the repository:**
   ```bash
   git clone https://github.com/<your-username>/sibyljudge-starter.git
   cd sibyljudge-starter
   ```
2. **Install dependencies:**
   - Backend:
     ```bash
     cd backend/server
     npm install
     ```
   - Frontend:
     ```bash
     cd ../../frontend/client
     npm install
     ```
3. **Configure environment variables:**
   - Copy `.env.example` to `.env` in both `backend/server` and `frontend/client` and fill in your Supabase credentials.

4. **Run the backend:**
   ```bash
   cd backend/server
   npm start
   ```
5. **Run the frontend:**
   ```bash
   cd frontend/client
   npm run dev
   ```

6. **Access the app:**
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend API: [http://localhost:5050](http://localhost:5050)

## Folder Structure

```
backend/
  server/         # Express API, Supabase integration, routes, middleware
frontend/
  client/         # React app, pages, components, services
```

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](LICENSE)

---

**SibylJudge** © 2025 XidanAbds29. All rights reserved.
