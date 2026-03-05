-- Create babies table for storing multiple babies per user
CREATE TABLE public.babies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    birth_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.babies ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for babies
CREATE POLICY "Users can view their own babies"
ON public.babies FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own babies"
ON public.babies FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own babies"
ON public.babies FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own babies"
ON public.babies FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates on babies
CREATE TRIGGER update_babies_updated_at
BEFORE UPDATE ON public.babies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create suggestions table
CREATE TABLE public.suggestions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for suggestions
CREATE POLICY "Users can create suggestions"
ON public.suggestions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own suggestions"
ON public.suggestions FOR SELECT
USING (auth.uid() = user_id);

-- Create feedback table
CREATE TABLE public.feedback (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for feedback
CREATE POLICY "Users can create feedback"
ON public.feedback FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback"
ON public.feedback FOR SELECT
USING (auth.uid() = user_id);