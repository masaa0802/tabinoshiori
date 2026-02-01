-- Drop tables in reverse order to avoid foreign key constraint issues
DROP TABLE IF EXISTS budgets;
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS itineraries;
DROP TABLE IF EXISTS groups;