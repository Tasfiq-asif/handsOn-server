-- Row Level Security Policies
-- This file contains all RLS policies for the database tables

-- Profiles Policies
CREATE POLICY "Allow users to read all profiles" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Allow joining events with profiles" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Allow users to insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Events Policies
CREATE POLICY "Allow public read access to events" 
ON public.events FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to create events" 
ON public.events FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow creator update access to events" 
ON public.events FOR UPDATE USING ((auth.uid())::text = (creator_id)::text);

CREATE POLICY "Allow creator delete access to events" 
ON public.events FOR DELETE USING ((auth.uid())::text = (creator_id)::text);

-- Event Participants Policies
CREATE POLICY "Allow public read access to event_participants" 
ON public.event_participants FOR SELECT USING (true);

CREATE POLICY "Allow users to register for events" 
ON public.event_participants FOR INSERT WITH CHECK ((auth.uid())::text = (user_id)::text);

CREATE POLICY "Allow users to update their own registrations" 
ON public.event_participants FOR UPDATE USING ((auth.uid())::text = (user_id)::text);

CREATE POLICY "Allow users to delete their own registrations" 
ON public.event_participants FOR DELETE USING ((auth.uid())::text = (user_id)::text);

-- Help Requests Policies
CREATE POLICY "Help requests are viewable by everyone" 
ON public.help_requests FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create help requests" 
ON public.help_requests FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own help requests" 
ON public.help_requests FOR UPDATE USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own help requests" 
ON public.help_requests FOR DELETE USING (auth.uid() = creator_id);

-- Help Request Helpers Policies
CREATE POLICY "Help request helpers are viewable by everyone" 
ON public.help_request_helpers FOR SELECT USING (true);

CREATE POLICY "Authenticated users can offer help" 
ON public.help_request_helpers FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own help offers" 
ON public.help_request_helpers FOR DELETE USING (auth.uid() = user_id);

-- Help Request Comments Policies
CREATE POLICY "Help request comments are viewable by everyone" 
ON public.help_request_comments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can add comments" 
ON public.help_request_comments FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own comments" 
ON public.help_request_comments FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON public.help_request_comments FOR DELETE USING (auth.uid() = user_id);