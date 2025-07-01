# Event Management & Booking Platform

A full-stack web application for managing events, booking domain experts, and tracking statistics. Built with a modern, responsive React frontend (Vite) and a Node.js/Express backend with MongoDB.

---

## Table of Contents
- [Features](#features)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Running the App](#running-the-app)
- [Usage Guide](#usage-guide)
- [Development Notes](#development-notes)
- [Deployment](#deployment)
- [License](#license)

---

## Features
- **User Authentication**: Secure login/signup for users and domain experts.
- **Event Management**: Create, view, and manage events. Register for events.
- **Expert Booking**: Book domain experts for sessions, with optional message/notes.
- **Profile Dashboard**: View booked experts, registered events, and personal info.
- **Responsive UI/UX**: Fully mobile/tablet-friendly layouts, unified design, and modern components.
- **Statistics & Impact**: Visualize event and booking stats with responsive charts.
- **Reusable Modals**: Consistent confirmation dialogs and popups.
- **Admin & User Flows**: Separate flows for users and domain experts.
- **API Integration**: Clean frontend-backend API bridge with token management.

---

## Project Structure
```
my-project/
├── backend/                # Express/MongoDB backend
│   ├── models/             # Mongoose schemas (User, Event, Slot, etc.)
│   ├── routes/             # API endpoints (auth, event, slot, etc.)
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Auth middleware
│   ├── images/             # Uploaded/static images
│   ├── server.js           # Main server file
│   ├── package.json        # Backend dependencies
│   └── vercel.json         # Vercel config (backend)
├── frontend/               # React (Vite) frontend
│   ├── src/
│   │   ├── components/     # All major UI components (NavBar, Profile, etc.)
│   │   ├── services/       # API service (api.js)
│   │   ├── context/        # React context (UserContext)
│   │   ├── assets/         # Images, logos
│   │   ├── utils/          # Custom hooks/utilities
│   │   └── ...             # Main app files
│   ├── public/             # Static assets
│   ├── package.json        # Frontend dependencies
│   ├── vite.config.js      # Vite config
│   └── README.md           # This file
├── package.json            # Root dependencies
└── vercel.json             # Vercel config (root)
```

---

## Tech Stack
- **Frontend**: React 19, Vite, React Router, Chart.js, React-Modal, React-Toastify, modern CSS
- **Backend**: Node.js, Express, Mongoose, JWT, Multer, dotenv
- **Database**: MongoDB (cloud/local)
- **Other**: Vercel (deployment), Axios, ESLint, jsPDF, xlsx

---

## Setup & Installation

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn
- MongoDB instance (local or cloud)

### 1. Clone the repository
```sh
git clone <your-repo-url>
cd my-project
```

### 2. Backend Setup
```sh
cd backend
npm install
# Create a .env file (see below)
```

### 3. Frontend Setup
```sh
cd ../frontend
npm install
```

---

## Environment Variables

### Backend (`backend/.env`)
```
MONGODB_URI=<your-mongodb-uri>
JWT_SECRET=<your-jwt-secret>
PORT=5000
```

### Frontend (`frontend/.env`)
```
VITE_BACKEND_URL=http://localhost:5000
```

---

## Running the App

### Start Backend
```sh
cd backend
npm run dev
```

### Start Frontend
```sh
cd frontend
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

---

## Usage Guide

### User Flows
- **Sign Up / Login**: Register as a user.
- **Browse Events**: View and register for events.
- **Book Experts**: Select a domain expert, pick a slot, and add an optional message.
- **Profile**: View your bookings, registered events, and update your info.
- **Statistics**: See charts and impact metrics on the Impact/Stats pages.
- **Admin**:can view 1->how user can interact with the events
                     2->how user can intereact with domain expert page.
                     3->Create, edit , delete and info events through manage events page.
                     4->view details of user, domain experts , request to become domain expert(can also handel them)
                     5->Also has persnolized graphs for domain expert to view the overall performance of every category.
                     credentials: id->admin@gmail.com
                                  password->123456  
- **User**:can view , events , book them , view domain experts , book there slots , can also ask any query related to domain expert.
      credentials:id->normal@gmail.com
                  password->123456
- **domain expert**:can view , events , book them , view book and ask queries to other domain experts also , can set/list its free slot for sessions and events.  
                    credentials:id->expert@gmail.com
                                password->123456
### Responsive Design
- All  pages/components are mobile and tablet friendly.
- Tables (Booked Experts, Registered Events) are horizontally scrollable on small screens.
- NavBar and Profile page have matching widths and alignment.
- Hamburger menu for navigation on mobile.

### Backend API
- RESTful endpoints for auth, events, slots, users, sessions, and requests.
- Slot booking supports an optional `message` field for user notes.
- Static images served from `/images`.

---

## Development Notes
- **Frontend**: All UI/UX is unified and modernized. Use `src/components/` for reusable UI.
- **Backend**: All models in `backend/models/`. Slot schema includes a `message` field for bookings.
- **API Service**: Use `src/services/api.js` for all HTTP requests.
- **Testing**: Use `npm run dev` for hot-reload during development.
- **Linting**: Run `npm run lint` in frontend for code quality.

---

## Deployment
- Both frontend and backend are configured for Vercel deployment.
- See `vercel.json` in root and subfolders for routing/static config.
- Ensure environment variables are set in Vercel dashboard.

---

## License
This project is for educational and demonstration purposes. See LICENSE file if present.
