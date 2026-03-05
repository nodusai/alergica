
-- Create a temporary storage bucket for imports
INSERT INTO storage.buckets (id, name, public) VALUES ('imports', 'imports', false);
