-- Create database (run this command separately)
-- CREATE DATABASE handsOn;

-- Connect to the database
-- \c handsOn;

-- Create users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create example table for protected data
CREATE TABLE items (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create example table for protected data
CREATE TABLE items (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- HandsOn Database Schema
-- Run this SQL in the Supabase SQL Editor to set up your database

-- Create profiles table to store user profile information
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY, -- This will use the Supabase auth.users id
  user_id UUID REFERENCES auth.users NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  bio TEXT,
  skills TEXT[] DEFAULT '{}',
  causes TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Create volunteer_activities table to track user volunteering history
CREATE TABLE IF NOT EXISTS volunteer_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  event_id UUID, -- You would reference your events table here
  hours NUMERIC NOT NULL,
  description TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Create events table for volunteer events
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  category TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Create event_participants table to track who's registered for events
CREATE TABLE IF NOT EXISTS event_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  status TEXT NOT NULL, -- e.g., 'registered', 'attended', 'canceled'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE,
  
  -- Enforce unique participants per event
  UNIQUE(event_id, user_id)
);

-- Create teams table for volunteer teams
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES auth.users NOT NULL,
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Create team_members table to track team membership
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  role TEXT NOT NULL, -- e.g., 'admin', 'member'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Enforce unique membership
  UNIQUE(team_id, user_id)
);

-- Add RLS (Row Level Security) policies for tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Profiles: users can read all profiles but only update their own
CREATE POLICY "Allow public read access to profiles" 
  ON profiles FOR SELECT 
  USING (true);

CREATE POLICY "Allow individual update access to profiles" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = user_id);

-- Events: anyone can see events, but only creators can update
CREATE POLICY "Allow public read access to events" 
  ON events FOR SELECT 
  USING (true);

CREATE POLICY "Allow creator update access to events" 
  ON events FOR UPDATE 
  USING (auth.uid() = creator_id);

-- Create functions and triggers as needed for your application
-- For example, you could add a function to calculate user impact scores
 