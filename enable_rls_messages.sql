-- Enable RLS on the messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to insert their own messages
CREATE POLICY "Users can insert their own messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

-- Policy to allow users to view messages sent by them or received by them
CREATE POLICY "Users can view their own messages"
ON public.messages
FOR SELECT
TO authenticated
USING (
  auth.uid() = sender_id OR 
  auth.uid() = receiver_id
);

-- Policy to allow users to update (e.g. mark as read) messages received by them
CREATE POLICY "Users can update messages received by them"
ON public.messages
FOR UPDATE
TO authenticated
USING (auth.uid() = receiver_id);
