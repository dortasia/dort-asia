-- Enable Realtime for the attendance table to ensure notifications are broadcasted
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;

-- Enable full replica identity so UPDATE events (like clock-out) contain the OLD row data
ALTER TABLE public.attendance REPLICA IDENTITY FULL;
