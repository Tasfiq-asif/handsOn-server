# HandsOn Volunteer Platform - Server

## 1. Project Overview

HandsOn is a community volunteer platform that connects volunteers with local events and community help opportunities. The server provides a RESTful API that handles user authentication, event management, registration, and other core functionalities of the platform.

## 2. Technologies Used

- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **PostgreSQL** - Relational database
- **Supabase** - Database and authentication provider
- **Supabase Auth** - Authentication and user management
- **Dotenv** - Environment variable management
- **Cors** - Cross-origin resource sharing

## 3. Features

- **User Authentication** - Secure login, registration, and session management
- **Event Management** - Create, read, update, and delete volunteer events
- **Event Registration** - Register for events and manage registrations
- **User Profiles** - Create and manage user profiles with skills and interests
- **Search & Filter** - Find events by category, location, and date
- **Impact Tracking** - Track volunteer hours and impact metrics

## 4. Database Schema

### Main Tables

- **users** (managed by Supabase Auth)

  - id (UUID, PK)
  - email
  - password (hashed)
  - created_at

- **profiles**

  - id (UUID, PK)
  - user_id (UUID, FK to users.id)
  - full_name
  - username
  - bio
  - skills (array)
  - causes (array)
  - created_at
  - updated_at

- **events**

  - id (UUID, PK)
  - creator_id (UUID, FK to users.id)
  - title
  - description
  - location
  - category
  - start_date
  - end_date
  - is_ongoing
  - capacity
  - created_at
  - updated_at

- **event_participants**
  - id (UUID, PK)
  - event_id (UUID, FK to events.id)
  - user_id (UUID, FK to users.id)
  - status
  - created_at
  - updated_at

### Views

- **events_with_creators** - Events joined with creator profile information
- **event_participants_with_users** - Event participants joined with user profile information

## 5. Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- PostgreSQL database (or Supabase account)

### Environment Setup

1. Clone the repository
2. Navigate to the server directory: `cd server`
3. Install dependencies: `npm install`
4. Create a `.env` file based on the `.env.example` template
5. Configure your environment variables:

   ```
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Supabase Configuration
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_KEY=your_supabase_service_key

   # Database Configuration (if not using Supabase)
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=handsOn
   DB_USER=postgres
   DB_PASSWORD=your_password
   ```

### Database Setup

1. Create a PostgreSQL database
2. Run the database setup script: `node create-database.js`
3. Apply the schema files in the `db/schemas` directory:
   - First run `1_create_tables.sql`
   - Then run `2_drop_views.sql`
   - Finally run `3_create_views.sql`

### Connecting with pgAdmin

You can use pgAdmin to view and manage your database tables locally:

1. **Install pgAdmin**: Download and install from [pgAdmin website](https://www.pgadmin.org/download/)

2. **Connect to Supabase PostgreSQL**:

   - Open pgAdmin
   - Right-click on "Servers" and select "Create" > "Server..."
   - In the General tab, give your connection a name (e.g., "Supabase HandsOn")
   - In the Connection tab, enter:
     - Host: `db.YOUR_SUPABASE_PROJECT_ID.supabase.co`
     - Port: `5432`
     - Maintenance database: `postgres`
     - Username: `postgres`
     - Password: Your Supabase database password
   - Save

3. **View Tables**:

   - Expand your server connection
   - Navigate to Databases > postgres > Schemas > public > Tables
   - You should see your tables (events, event_participants, profiles)

4. **Execute SQL**:

   - Right-click on any database object and select "Query Tool"
   - Write and execute SQL queries directly

5. **Troubleshooting Connection**:
   - Ensure your IP address is whitelisted in Supabase dashboard
   - Check that the database password is correct
   - Verify that the database is not in restricted mode

## 6. API Documentation

### Authentication Endpoints

#### `POST /api/auth/register`

- **Description**: Register a new user
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword",
    "full_name": "John Doe"
  }
  ```
- **Response**: User object with token

#### `POST /api/auth/login`

- **Description**: Login an existing user
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword"
  }
  ```
- **Response**: User object with token

#### `GET /api/auth/me`

- **Description**: Get current user information
- **Headers**: Authorization: Bearer {token}
- **Response**: User object

### Profile Endpoints

#### `GET /api/profiles/:userId`

- **Description**: Get a user's profile
- **Headers**: Authorization: Bearer {token}
- **Response**: Profile object

#### `PUT /api/profiles/:userId`

- **Description**: Update a user's profile
- **Headers**: Authorization: Bearer {token}
- **Request Body**:
  ```json
  {
    "full_name": "John Doe",
    "username": "johndoe",
    "bio": "Passionate volunteer",
    "skills": ["teaching", "organizing"],
    "causes": ["education", "environment"]
  }
  ```
- **Response**: Updated profile object

### Event Endpoints

#### `GET /api/events`

- **Description**: Get all events with optional filters
- **Query Parameters**:
  - type: "all", "events", "help" (optional)
  - category: string (optional)
  - location: string (optional)
  - startDate: date string (optional)
- **Response**: Array of event objects

#### `GET /api/events/:id`

- **Description**: Get a specific event by ID
- **Response**: Event object with creator and participants

#### `POST /api/events`

- **Description**: Create a new event
- **Headers**: Authorization: Bearer {token}
- **Request Body**:
  ```json
  {
    "title": "Beach Cleanup",
    "description": "Help clean the local beach",
    "location": "Main Beach",
    "category": "Environment",
    "start_date": "2023-06-15T10:00:00Z",
    "end_date": "2023-06-15T14:00:00Z",
    "is_ongoing": false,
    "capacity": 20
  }
  ```
- **Response**: Created event object

#### `PUT /api/events/:id`

- **Description**: Update an event
- **Headers**: Authorization: Bearer {token}
- **Request Body**: Event object fields to update
- **Response**: Updated event object

#### `DELETE /api/events/:id`

- **Description**: Delete an event
- **Headers**: Authorization: Bearer {token}
- **Response**: Success message

#### `POST /api/events/:id/register`

- **Description**: Register for an event
- **Headers**: Authorization: Bearer {token}
- **Response**: Registration confirmation

#### `POST /api/events/:id/cancel`

- **Description**: Cancel registration for an event
- **Headers**: Authorization: Bearer {token}
- **Response**: Cancellation confirmation

#### `GET /api/events/:id/registration-status`

- **Description**: Check if the current user is registered for an event
- **Headers**: Authorization: Bearer {token}
- **Response**: Boolean indicating registration status

#### `GET /api/events/user`

- **Description**: Get events the current user is registered for
- **Headers**: Authorization: Bearer {token}
- **Response**: Array of event objects

## 7. Running the Project

### Development Mode

```bash
npm run dev
```

This will start the server with nodemon for automatic reloading on file changes.

### Production Mode

```bash
npm start
```

This will start the server in production mode.

### Deployment

The server can be deployed to various platforms:

1. **Heroku**:

   - Install Heroku CLI
   - Login to Heroku: `heroku login`
   - Create a new app: `heroku create`
   - Push to Heroku: `git push heroku main`
   - Set environment variables: `heroku config:set KEY=VALUE`

2. **Railway**:

   - Connect your GitHub repository
   - Configure environment variables
   - Deploy from the Railway dashboard

3. **Docker**:
   - Build the Docker image: `docker build -t handsOn-server .`
   - Run the container: `docker run -p 5000:5000 handsOn-server`

### Monitoring and Logs

- View logs in development: Console output
- View logs in production: `heroku logs --tail` (if using Heroku)
- Use a monitoring service like New Relic or Datadog for production monitoring

## 8. Git Workflow

This project follows a feature branch workflow with pull requests for code review and integration.

### Current Branches

- `main` - Production-ready code
- `feature/add-jwt-authentication` - JWT authentication implementation
- `feature/event-management` - Event management functionality

### Merging Feature Branches via Pull Requests

1. **Ensure your feature branch is up to date with main**:

   ```bash
   git checkout feature/your-branch
   git pull origin main
   # Resolve any conflicts if they occur
   ```

2. **Push your changes to the remote repository**:

   ```bash
   git push origin feature/your-branch
   ```

3. **Create a Pull Request (PR)**:

   - Go to your GitHub repository
   - Click on "Pull requests" tab
   - Click "New pull request"
   - Set "base" branch to `main`
   - Set "compare" branch to your feature branch
   - Click "Create pull request"
   - Add a descriptive title and description
   - Request reviewers if needed

4. **Code Review Process**:

   - Reviewers will examine your code and provide feedback
   - Address any comments or requested changes
   - Push additional commits to your feature branch as needed

5. **Merge the Pull Request**:

   - Once approved, click "Merge pull request"
   - Choose the appropriate merge strategy:
     - Merge commit: Preserves all commits history
     - Squash and merge: Combines all commits into one
     - Rebase and merge: Applies changes without a merge commit
   - Click "Confirm merge"

6. **Delete the Feature Branch (Optional)**:
   - After successful merge, you can delete the feature branch
   - This keeps the repository clean

### Branch Protection Rules (Recommended)

Consider setting up branch protection rules for the `main` branch:

- Require pull request reviews before merging
- Require status checks to pass before merging
- Restrict who can push to the branch
