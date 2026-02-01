-- Alter destination column to text array
ALTER TABLE itineraries
ALTER COLUMN destination TYPE text[]
USING CASE
  WHEN destination IS NULL THEN NULL
  WHEN destination = '' THEN ARRAY[]::text[]
  ELSE ARRAY[destination]::text[]
END;

-- Alter travel_purpose column to text array
ALTER TABLE itineraries
ALTER COLUMN travel_purpose TYPE text[]
USING CASE
  WHEN travel_purpose IS NULL THEN NULL
  WHEN travel_purpose = '' THEN ARRAY[]::text[]
  ELSE ARRAY[travel_purpose]::text[]
END;
