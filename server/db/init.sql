-- Drop tables if they exist
DROP TABLE IF EXISTS storage_history;
DROP TABLE IF EXISTS storage_forecast;
DROP TABLE IF EXISTS pipeline_effects;

-- Create the database schema
CREATE TABLE storage_systems (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    total_capacity_gb NUMERIC NOT NULL, -- Total storage capacity in GB
    used_capacity_gb NUMERIC NOT NULL, -- Current storage usage in GB
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pipelines (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE, -- Name of the pipeline
    description TEXT NOT NULL, -- Pipeline description
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, failed, or paused
    last_run TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Last time the pipeline ran successfully
    impact_rate_gb_per_day NUMERIC NOT NULL -- How much storage the pipeline impacts per day (positive or negative)
);

CREATE TABLE storage_usage_history (
    id SERIAL PRIMARY KEY,
    storage_system_id INT NOT NULL REFERENCES storage_systems(id) ON DELETE CASCADE,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Timestamp for the data point
    used_capacity_gb NUMERIC NOT NULL -- Storage usage in GB at a specific time
);

-- Insert example storage systems
INSERT INTO storage_systems (name, total_capacity_gb, used_capacity_gb) VALUES
('Primary Storage', 1000, 500), -- A storage system with 1000GB total capacity and 500GB used (storage_system_id=1)
('Backup Storage', 2000, 800); -- A larger storage system (storage_system_id=2)

-- Insert example pipelines
INSERT INTO pipelines (name, description, status, impact_rate_gb_per_day) VALUES
('Garbage Collection Pipeline', 'Deletes unneeded files to free up space.', 'active', -50), -- Frees 50GB/day
('Compaction Pipeline', 'Reorganizes data on disk to use less space.', 'active', -10), -- Frees 10GB/day
('Data Ingestion Pipeline', 'Brings in new data from external sources.', 'active', 30), -- Adds 30GB/day
('Backup Pipeline', 'Copies data elsewhere for safety.', 'active', 0); -- Neutral impact

-- Insert example historical storage usage data
-- (Simulating usage trends over the past week)
INSERT INTO storage_usage_history (storage_system_id, recorded_at, used_capacity_gb) VALUES
(1, '2025-04-05 00:00:00', 480),
(1, '2025-04-06 00:00:00', 490),
(1, '2025-04-07 00:00:00', 500),
(1, '2025-04-08 00:00:00', 515),
(1, '2025-04-09 00:00:00', 530),
(1, '2025-04-10 00:00:00', 550),
(1, '2025-04-11 00:00:00', 570),
(2, '2025-04-05 00:00:00', 780),
(2, '2025-04-06 00:00:00', 785),
(2, '2025-04-07 00:00:00', 790),
(2, '2025-04-08 00:00:00', 800),
(2, '2025-04-09 00:00:00', 810),
(2, '2025-04-10 00:00:00', 820),
(2, '2025-04-11 00:00:00', 830);

-- Simulate a pipeline failure (e.g., Garbage Collection Pipeline fails)
UPDATE pipelines SET status = 'failed', last_run = '2025-04-10 00:00:00' WHERE name = 'Garbage Collection Pipeline';

-- Create notification function and trigger for pipeline changes
CREATE OR REPLACE FUNCTION notify_pipeline_change()
RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify(
    'pipeline_change',
    json_build_object(
      'action', TG_OP,
      'data', row_to_json(NEW)
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pipeline_change_trigger
AFTER INSERT OR UPDATE OR DELETE ON pipelines
FOR EACH ROW EXECUTE FUNCTION notify_pipeline_change();

-- Create notification function and trigger for storage system changes
CREATE OR REPLACE FUNCTION notify_storage_change()
RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify(
    'storage_change',
    json_build_object(
      'action', TG_OP,
      'data', row_to_json(NEW)
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER storage_change_trigger
AFTER INSERT OR UPDATE OR DELETE ON storage_systems
FOR EACH ROW EXECUTE FUNCTION notify_storage_change();

-- Create notification function and trigger for storage history changes
CREATE OR REPLACE FUNCTION notify_storage_history_change()
RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify(
    'storage_change',
    json_build_object(
      'action', TG_OP,
      'data', row_to_json(NEW)
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER storage_history_change_trigger
AFTER INSERT OR UPDATE OR DELETE ON storage_usage_history
FOR EACH ROW EXECUTE FUNCTION notify_storage_history_change();