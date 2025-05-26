/*
  # Create presets table for AquaFlow AI

  1. New Tables
    - `presets`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `config` (jsonb, not null)
      - `user_id` (uuid, foreign key to auth.users, not null)
      - `created_at` (timestamp with time zone, default now())
  2. Security
    - Enable RLS on `presets` table
    - Add policy for authenticated users to read, insert, update, and delete their own presets
*/

CREATE TABLE IF NOT EXISTS presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  config jsonb NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE presets ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own presets
CREATE POLICY "Users can read their own presets"
  ON presets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to insert their own presets
CREATE POLICY "Users can insert their own presets"
  ON presets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own presets
CREATE POLICY "Users can update their own presets"
  ON presets
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to delete their own presets
CREATE POLICY "Users can delete their own presets"
  ON presets
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);