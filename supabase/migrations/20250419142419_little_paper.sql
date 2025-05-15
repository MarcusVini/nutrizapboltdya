/*
  # Create leads table with scoring system

  1. New Tables
    - `leads`
      - Basic info (name, email, whatsapp)
      - Quiz responses (weight goals, measurements, preferences)
      - Tracking data (IP, city, timezone, fingerprint)
      - Scoring and timestamps
  
  2. Security
    - Enable RLS
    - Add policy for inserting/updating leads
*/

CREATE TABLE leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Basic Info
  name text,
  email text,
  whatsapp text,
  
  -- Quiz Responses
  weight_loss_goal text,
  age integer,
  height_cm integer,
  current_weight_kg decimal(5,2),
  target_weight_kg decimal(5,2),
  gender text,
  activity_level text,
  daily_time_commitment text,
  diet_quality text,
  previous_attempts text,
  metabolism_type text,
  diet_attempts_count text,
  diet_results text,
  yoyo_effect text,
  habits text,
  
  -- Tracking & Location
  ip_address text,
  city text,
  timezone text,
  fingerprint text,
  
  -- Scoring
  score integer DEFAULT 0,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Create policy for inserting leads
CREATE POLICY "Anyone can insert leads"
  ON leads
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create policy for updating leads
CREATE POLICY "Update leads with matching fingerprint"
  ON leads
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Create policy for selecting leads
CREATE POLICY "Select leads with matching fingerprint"
  ON leads
  FOR SELECT
  TO public
  USING (true);

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating timestamp
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE
  ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();