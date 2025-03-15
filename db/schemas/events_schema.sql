-- Events Schema
-- This file contains the SQL to create the tables for the events feature

-- Events Table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    category TEXT,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    is_ongoing BOOLEAN,
    capacity INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Event Participants Table
CREATE TABLE IF NOT EXISTS public.event_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Views for joining events with creators and participants
CREATE OR REPLACE VIEW public.events_with_creators AS
SELECT 
    e.*,
    p.user_id as creator_user_id,
    p.full_name as creator_name,
    p.username as creator_username
FROM 
    public.events e
LEFT JOIN 
    public.profiles p ON e.creator_id = p.user_id;

-- Enhanced view for event participants with complete profile information
CREATE OR REPLACE VIEW public.event_participants_with_users AS
SELECT 
    ep.id,
    ep.event_id,
    ep.user_id,
    ep.status,
    ep.created_at,
    ep.updated_at,
    p.full_name,
    p.username,
    p.bio,
    p.skills,
    p.causes,
    json_build_object(
        'id', p.id,
        'user_id', p.user_id,
        'full_name', p.full_name,
        'username', p.username,
        'bio', p.bio
    ) as user_profile
FROM 
    public.event_participants ep
LEFT JOIN 
    public.profiles p ON ep.user_id = p.user_id;

-- Enable Row Level Security
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;