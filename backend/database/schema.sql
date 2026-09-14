CREATE SCHEMA IF NOT EXISTS duties;

-- gen_random_uuid() is built into PostgreSQL 13+
CREATE TABLE IF NOT EXISTS duties.duties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 200)
);
