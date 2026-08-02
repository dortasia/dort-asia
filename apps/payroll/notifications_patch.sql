-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert notifications
CREATE POLICY "Allow authenticated users to insert notifications" 
ON public.notifications FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to view notifications
CREATE POLICY "Allow authenticated users to view notifications" 
ON public.notifications FOR SELECT 
USING (auth.role() = 'authenticated');

-- Add realtime publication for notifications if needed
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
