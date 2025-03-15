-- Database Indexes
-- This file contains all indexes for improving query performance

-- Profiles Indexes
CREATE UNIQUE INDEX IF NOT EXISTS profiles_pkey ON public.profiles USING btree (id, user_id);
CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_key ON public.profiles USING btree (user_id);

-- Events Indexes
CREATE UNIQUE INDEX IF NOT EXISTS events_pkey ON public.events USING btree (id);
CREATE INDEX IF NOT EXISTS events_creator_id_idx ON public.events USING btree (creator_id);

-- Event Participants Indexes
CREATE UNIQUE INDEX IF NOT EXISTS event_participants_pkey ON public.event_participants USING btree (id);
CREATE INDEX IF NOT EXISTS event_participants_event_id_idx ON public.event_participants USING btree (event_id);
CREATE INDEX IF NOT EXISTS event_participants_user_id_idx ON public.event_participants USING btree (user_id);

-- Help Requests Indexes
CREATE UNIQUE INDEX IF NOT EXISTS help_requests_pkey ON public.help_requests USING btree (id);
CREATE INDEX IF NOT EXISTS idx_help_requests_creator_id ON public.help_requests USING btree (creator_id);
CREATE INDEX IF NOT EXISTS idx_help_requests_status ON public.help_requests USING btree (status);
CREATE INDEX IF NOT EXISTS idx_help_requests_urgency ON public.help_requests USING btree (urgency);
CREATE INDEX IF NOT EXISTS idx_help_requests_category ON public.help_requests USING btree (category);

-- Help Request Helpers Indexes
CREATE UNIQUE INDEX IF NOT EXISTS help_request_helpers_pkey ON public.help_request_helpers USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS help_request_helpers_help_request_id_user_id_key ON public.help_request_helpers USING btree (help_request_id, user_id);
CREATE INDEX IF NOT EXISTS idx_help_request_helpers_help_request_id ON public.help_request_helpers USING btree (help_request_id);
CREATE INDEX IF NOT EXISTS idx_help_request_helpers_user_id ON public.help_request_helpers USING btree (user_id);

-- Help Request Comments Indexes
CREATE UNIQUE INDEX IF NOT EXISTS help_request_comments_pkey ON public.help_request_comments USING btree (id);
CREATE INDEX IF NOT EXISTS idx_help_request_comments_help_request_id ON public.help_request_comments USING btree (help_request_id);
CREATE INDEX IF NOT EXISTS idx_help_request_comments_user_id ON public.help_request_comments USING btree (user_id);