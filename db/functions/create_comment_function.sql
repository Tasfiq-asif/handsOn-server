-- Create a function to insert comments that bypasses RLS
CREATE OR REPLACE FUNCTION insert_help_request_comment(
  p_help_request_id UUID,
  p_user_id UUID,
  p_content TEXT
)
RETURNS SETOF help_request_comments
LANGUAGE plpgsql
SECURITY DEFINER -- This makes the function run with the privileges of the function creator
AS $$
DECLARE
  v_comment_id UUID;
BEGIN
  -- Insert the comment
  INSERT INTO help_request_comments (
    id,
    help_request_id,
    user_id,
    content,
    created_at
  ) VALUES (
    uuid_generate_v4(),
    p_help_request_id,
    p_user_id,
    p_content,
    NOW()
  )
  RETURNING id INTO v_comment_id;
  
  -- Return the inserted comment
  RETURN QUERY
  SELECT * FROM help_request_comments WHERE id = v_comment_id;
END;
$$; 