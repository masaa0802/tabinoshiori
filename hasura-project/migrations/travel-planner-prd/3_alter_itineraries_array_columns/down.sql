-- Revert destination column to VARCHAR
ALTER TABLE itineraries
ALTER COLUMN destination TYPE VARCHAR(255)
USING CASE
  WHEN destination IS NULL THEN NULL
  WHEN array_length(destination, 1) IS NULL THEN ''
  ELSE destination[1]
END;

-- Revert travel_purpose column to TEXT
ALTER TABLE itineraries
ALTER COLUMN travel_purpose TYPE TEXT
USING CASE
  WHEN travel_purpose IS NULL THEN NULL
  WHEN array_length(travel_purpose, 1) IS NULL THEN ''
  ELSE travel_purpose[1]
END;
