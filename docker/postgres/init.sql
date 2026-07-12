-- PostgreSQL initialization script
-- This runs automatically when the postgres container starts for the first time

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE saraburi_db TO saraburi_user;
