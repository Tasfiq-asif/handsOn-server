-- Create views with correct column names

-- View for events with creator information
CREATE VIEW public.events_with_creators AS
SELECT 
    e.*,
    p.user_id as creator_user_id,
    p.full_name as creator_name,
    p.username as creator_username
FROM 
    public.events e
LEFT JOIN 
    public.profiles p ON e.creator_id = p.user_id;

-- View for event participants with profile information
CREATE VIEW public.event_participants_with_users AS
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