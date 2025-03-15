# HandsOn Volunteer Platform - Server

## 1. Project Overview

HandsOn is a community volunteer platform that connects volunteers with local events and help requests. The server provides a RESTful API for user authentication, event management, and registration.

**Live API:** [https://hands-on-server.vercel.app](https://hands-on-server.vercel.app)  
**Client App:** [https://hands-on-client.vercel.app](https://hands-on-client.vercel.app)

## 2. Technologies Used

- **Node.js & Express.js** - Backend framework
- **PostgreSQL & Supabase** - Database and authentication
- **JWT** - Authentication tokens
- **Vercel** - Deployment platform

## 3. Features

- 🔐 **User Authentication** - Secure login, registration, and session management
- 📅 **Event Management** - Create, read, update, and delete volunteer events
- ✅ **Event Registration** - Register for events and manage registrations
- 👤 **User Profiles** - Create and manage user profiles with skills and interests
- 🔍 **Search & Filter** - Find events by category, location, and date

## 4. Database Schema

```
users (Supabase Auth)
  ├── id (UUID, PK)
  ├── email
  ├── password (hashed)
  └── created_at

profiles
  ├── id (UUID, PK)
  ├── user_id (UUID, FK → users.id)
  ├── full_name
  ├── username
  ├── bio
  ├── skills (array)
  └── causes (array)

events
  ├── id (UUID, PK)
  ├── creator_id (UUID, FK → users.id)
  ├── title
  ├── description
  ├── location
  ├── category
  ├── start_date
  ├── end_date
  ├── is_ongoing
  └── capacity

event_participants
  ├── id (UUID, PK)
  ├── event_id (UUID, FK → events.id)
  ├── user_id (UUID, FK → users.id)
  ├── status
  └── created_at
```

## 5. Setup Instructions

### Prerequisites

- Node.js (v14+)
- npm or yarn
- Supabase account

### Environment Setup

1. Clone the repository
2. Navigate to the server directory: `cd server`
3. Install dependencies: `npm install`
4. Create a `.env` file with the following variables:
   ```
   PORT=4000
   NODE_ENV=development
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_KEY=your_supabase_service_key
   CLIENT_URL=http://localhost:5173
   ```

## 6. API Documentation

### Authentication Endpoints

- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login an existing user
- `POST /api/users/google-login` - Login with Google OAuth
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update user profile

### Event Endpoints

- `GET /api/events` - Get all events with optional filters
- `GET /api/events/:id` - Get a specific event
- `POST /api/events` - Create a new event
- `PUT /api/events/:id` - Update an event
- `DELETE /api/events/:id` - Delete an event
- `POST /api/events/:id/register` - Register for an event
- `POST /api/events/:id/cancel` - Cancel registration
- `GET /api/events/:id/registration-status` - Check registration status

### Help Request Endpoints

- `GET /api/help-requests` - Get all help requests
- `GET /api/help-requests/:id` - Get a specific help request
- `POST /api/help-requests` - Create a new help request
- `PUT /api/help-requests/:id` - Update a help request
- `DELETE /api/help-requests/:id` - Delete a help request

## 7. Running the Project

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

### Deployment

The server is deployed on Vercel. To deploy your own instance:

1. Fork the repository
2. Connect to Vercel
3. Configure environment variables
4. Deploy

For detailed API documentation, visit the [API Documentation](https://hands-on-server.vercel.app/api-docs) page.
