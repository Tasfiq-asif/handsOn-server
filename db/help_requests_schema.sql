-- Help Requests Schema
-- This file contains the SQL to create the tables for the help requests feature

-- Help Requests Table
-- Note: creator_id references auth.users(id), which is linked to profiles.user_id
-- When querying, use creator:profiles(...) to join with the profiles table
CREATE TABLE IF NOT EXISTS public.help_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT,
    category TEXT,
    urgency TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, urgent
    status TEXT NOT NULL DEFAULT 'open', -- open, in_progress, completed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Help Request Helpers Table (for users who offer help)
CREATE TABLE IF NOT EXISTS public.help_request_helpers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    help_request_id UUID NOT NULL REFERENCES public.help_requests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(help_request_id, user_id)
);

-- Help Request Comments Table
CREATE TABLE IF NOT EXISTS public.help_request_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    help_request_id UUID NOT NULL REFERENCES public.help_requests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_help_requests_creator_id ON public.help_requests(creator_id);
CREATE INDEX IF NOT EXISTS idx_help_requests_status ON public.help_requests(status);
CREATE INDEX IF NOT EXISTS idx_help_requests_urgency ON public.help_requests(urgency);
CREATE INDEX IF NOT EXISTS idx_help_requests_category ON public.help_requests(category);
CREATE INDEX IF NOT EXISTS idx_help_request_helpers_help_request_id ON public.help_request_helpers(help_request_id);
CREATE INDEX IF NOT EXISTS idx_help_request_helpers_user_id ON public.help_request_helpers(user_id);
CREATE INDEX IF NOT EXISTS idx_help_request_comments_help_request_id ON public.help_request_comments(help_request_id);
CREATE INDEX IF NOT EXISTS idx_help_request_comments_user_id ON public.help_request_comments(user_id);

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE public.help_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_request_helpers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_request_comments ENABLE ROW LEVEL SECURITY;

-- Help Requests Policies
-- Anyone can read help requests
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'help_requests' AND policyname = 'Help requests are viewable by everyone'
    ) THEN
        CREATE POLICY "Help requests are viewable by everyone" 
        ON public.help_requests FOR SELECT USING (true);
    END IF;
END
$$;

-- Only authenticated users can create help requests
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'help_requests' AND policyname = 'Authenticated users can create help requests'
    ) THEN
        CREATE POLICY "Authenticated users can create help requests" 
        ON public.help_requests FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
END
$$;

-- Only the creator can update their help requests
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'help_requests' AND policyname = 'Users can update their own help requests'
    ) THEN
        CREATE POLICY "Users can update their own help requests" 
        ON public.help_requests FOR UPDATE TO authenticated USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);
    END IF;
END
$$;

-- Only the creator can delete their help requests
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'help_requests' AND policyname = 'Users can delete their own help requests'
    ) THEN
        CREATE POLICY "Users can delete their own help requests" 
        ON public.help_requests FOR DELETE TO authenticated USING (auth.uid() = creator_id);
    END IF;
END
$$;

-- Help Request Helpers Policies
-- Anyone can read who has offered help
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'help_request_helpers' AND policyname = 'Help request helpers are viewable by everyone'
    ) THEN
        CREATE POLICY "Help request helpers are viewable by everyone" 
        ON public.help_request_helpers FOR SELECT USING (true);
    END IF;
END
$$;

-- Only authenticated users can offer help
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'help_request_helpers' AND policyname = 'Authenticated users can offer help'
    ) THEN
        CREATE POLICY "Authenticated users can offer help" 
        ON public.help_request_helpers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
    END IF;
END
$$;

-- Only the user who offered help can delete their offer
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'help_request_helpers' AND policyname = 'Users can delete their own help offers'
    ) THEN
        CREATE POLICY "Users can delete their own help offers" 
        ON public.help_request_helpers FOR DELETE TO authenticated USING (auth.uid() = user_id);
    END IF;
END
$$;

-- Help Request Comments Policies
-- Anyone can read comments
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'help_request_comments' AND policyname = 'Help request comments are viewable by everyone'
    ) THEN
        CREATE POLICY "Help request comments are viewable by everyone" 
        ON public.help_request_comments FOR SELECT USING (true);
    END IF;
END
$$;

-- Only authenticated users can add comments
DO $$
BEGIN
    -- Drop the existing policy if it exists
    DROP POLICY IF EXISTS "Authenticated users can add comments" ON public.help_request_comments;
    
    -- Create the new policy
    CREATE POLICY "Authenticated users can add comments" 
    ON public.help_request_comments FOR INSERT TO authenticated WITH CHECK (true);
END
$$;

-- Only the comment author can update their comments
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'help_request_comments' AND policyname = 'Users can update their own comments'
    ) THEN
        CREATE POLICY "Users can update their own comments" 
        ON public.help_request_comments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
END
$$;

-- Only the comment author can delete their comments
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'help_request_comments' AND policyname = 'Users can delete their own comments'
    ) THEN
        CREATE POLICY "Users can delete their own comments" 
        ON public.help_request_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);
    END IF;
END
$$; 