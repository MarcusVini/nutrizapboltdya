/*
  # Create member area tables

  1. New Tables
    - `health_questionnaires`
      - Basic health info
      - Medical conditions
      - Dietary restrictions
      - Lifestyle habits
    - `meal_plans`
      - Generated meal plans
      - Plan metadata
      - User preferences
    - `progress_tracking`
      - Weight tracking
      - Measurements
      - Progress photos
  
  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Health Questionnaires Table
CREATE TABLE health_questionnaires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Medical History
  has_diabetes boolean DEFAULT false,
  has_hypertension boolean DEFAULT false,
  has_heart_disease boolean DEFAULT false,
  has_thyroid_issues boolean DEFAULT false,
  other_conditions text,
  
  -- Dietary Information
  is_vegetarian boolean DEFAULT false,
  is_vegan boolean DEFAULT false,
  is_pescatarian boolean DEFAULT false,
  has_gluten_allergy boolean DEFAULT false,
  has_lactose_intolerance boolean DEFAULT false,
  has_nut_allergy boolean DEFAULT false,
  other_allergies text,
  
  -- Lifestyle
  sleep_hours integer,
  stress_level text,
  water_intake_liters numeric(3,1),
  alcohol_consumption text,
  smoking_status text,
  
  -- Exercise
  exercise_frequency text,
  exercise_intensity text,
  preferred_exercise_types text[],
  
  -- Eating Habits
  meal_frequency integer,
  snacking_frequency text,
  emotional_eating boolean,
  night_eating boolean,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Meal Plans Table
CREATE TABLE meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  
  plan_type text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  daily_calorie_target integer,
  protein_target integer,
  carb_target integer,
  fat_target integer,
  
  meal_preferences jsonb,
  excluded_foods text[],
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Progress Tracking Table
CREATE TABLE progress_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  
  date date NOT NULL,
  weight_kg numeric(5,2),
  waist_cm numeric(5,2),
  hip_cm numeric(5,2),
  chest_cm numeric(5,2),
  arm_cm numeric(5,2),
  thigh_cm numeric(5,2),
  
  body_fat_percentage numeric(4,1),
  muscle_mass_kg numeric(5,2),
  
  photo_url text,
  notes text,
  
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE health_questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_tracking ENABLE ROW LEVEL SECURITY;

-- Policies for health_questionnaires
CREATE POLICY "Users can view their own health questionnaire"
  ON health_questionnaires
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their health questionnaire"
  ON health_questionnaires
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their health questionnaire"
  ON health_questionnaires
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for meal_plans
CREATE POLICY "Users can view their meal plans"
  ON meal_plans
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their meal plans"
  ON meal_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their meal plans"
  ON meal_plans
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for progress_tracking
CREATE POLICY "Users can view their progress"
  ON progress_tracking
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create progress entries"
  ON progress_tracking
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their progress entries"
  ON progress_tracking
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Update trigger for health_questionnaires
CREATE TRIGGER update_health_questionnaires_updated_at
  BEFORE UPDATE
  ON health_questionnaires
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update trigger for meal_plans
CREATE TRIGGER update_meal_plans_updated_at
  BEFORE UPDATE
  ON meal_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();