# Database Schema Setup Instructions

## Error Resolution for View Column Renaming

If you encounter the error:

```
ERROR: 42P16: cannot change name of view column "creator_name" to "creator_user_id"
HINT: Use ALTER VIEW ... RENAME COLUMN ... to change name of view column instead.
```

This happens because you're trying to change the name of an existing view column using `CREATE OR REPLACE VIEW`. In PostgreSQL, you can't change column names this way.

## Solution: Apply SQL Scripts in Sequence

To fix this issue, apply the SQL scripts in the following order in the Supabase SQL Editor:

1. First, run `1_create_tables.sql` to ensure the base tables exist
2. Then run `2_drop_views.sql` to drop any existing views
3. Finally, run `3_create_views.sql` to create the views with the correct column names

## Alternative: Manual Steps

If you prefer to run individual commands:

1. Drop the existing views:

```sql
DROP VIEW IF EXISTS public.event_participants_with_users;
DROP VIEW IF EXISTS public.events_with_creators;
```

2. Create the views with the correct column names:

```sql
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
```

## Verifying the Changes

After applying these changes, you can verify the view structure with:

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'event_participants_with_users'
ORDER BY ordinal_position;
```

This should show the correct column names in the view.
