-- Fix the RLS policy for help_request_comments table
-- This script drops the existing policy and creates a new one that allows any authenticated user to add comments

-- Drop the existing policy
DROP POLICY IF EXISTS "Authenticated users can add comments" ON public.help_request_comments;

-- Create a new policy that allows any authenticated user to add comments
CREATE POLICY "Authenticated users can add comments" 
ON public.help_request_comments 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Verify the policy was created
SELECT * FROM pg_policies WHERE tablename = 'help_request_comments'; 