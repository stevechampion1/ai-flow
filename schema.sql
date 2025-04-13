-- schema.sql
-- PostgreSQL database schema definition for AI-Flow

-- Workflows Table
CREATE TABLE workflows (
    id SERIAL PRIMARY KEY,                  -- Workflow ID, auto-incrementing integer, primary key
    name VARCHAR(255) NOT NULL,           -- Workflow Name, cannot be null, maximum length 255
    description TEXT,                      -- Workflow Description, optional, text type for longer descriptions
    steps TEXT[]                          -- Workflow Steps, using TEXT array to store list of step names or IDs
    -- You can add more fields as needed, e.g., creation time, modification time, author, etc.
);

-- AI Modules Table
CREATE TABLE ai_modules (
    id SERIAL PRIMARY KEY,                 -- AI Module ID, auto-incrementing integer, primary key
    name VARCHAR(255) NOT NULL,          -- AI Module Name, cannot be null, maximum length 255
    type VARCHAR(100) NOT NULL,          -- AI Module Type, cannot be null, e.g., "text_generation", "image_classification", max length 100
    description TEXT,                     -- AI Module Description, optional
    config JSONB                          -- AI Module Configuration, using JSONB type for flexible configuration parameters, JSONB is efficient JSON data type in PostgreSQL
    -- You can add more fields as needed, e.g., creation time, modification time, category, etc.
);

-- Indexes to optimize query performance, e.g., on name or type fields
-- CREATE INDEX idx_workflows_name ON workflows (name);
-- CREATE INDEX idx_ai_modules_type ON ai_modules (type);

-- Comments to improve readability
COMMENT ON TABLE workflows IS 'Table storing workflow definitions';
COMMENT ON COLUMN workflows.id IS 'Workflow ID, primary key, auto-incrementing';
COMMENT ON COLUMN workflows.name IS 'Workflow Name';
COMMENT ON COLUMN workflows.description IS 'Workflow Description';
COMMENT ON COLUMN workflows.steps IS 'Workflow step list, storing step names or IDs';

COMMENT ON TABLE ai_modules IS 'Table storing AI module definitions';
COMMENT ON COLUMN ai_modules.id IS 'AI Module ID, primary key, auto-incrementing';
COMMENT ON COLUMN ai_modules.name IS 'AI Module Name';
COMMENT ON COLUMN ai_modules.type IS 'AI Module Type, e.g., text_generation, image_classification';
COMMENT ON COLUMN ai_modules.description IS 'AI Module Description';
COMMENT ON COLUMN ai_modules.config IS 'AI module configuration parameters, JSONB type';