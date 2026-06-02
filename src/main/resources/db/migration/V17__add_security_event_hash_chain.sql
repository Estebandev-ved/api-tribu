ALTER TABLE security_events
  ADD COLUMN previous_hash VARCHAR(64) NULL,
  ADD COLUMN current_hash VARCHAR(64) NULL;
