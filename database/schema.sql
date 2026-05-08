CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM (
    'Manager',
    'Employee'
);

DROP TYPE IF EXISTS project_status CASCADE;
CREATE TYPE project_status AS ENUM (
    'Planning',
    'Active',
    'Completed',
    'Archived'
);

DROP TYPE IF EXISTS task_status CASCADE;
CREATE TYPE task_status AS ENUM (
    'To-Do',
    'In Progress',
    'Paused',
    'Completed',
    'Cancelled'
);

DROP TYPE IF EXISTS task_category CASCADE;
CREATE TYPE task_category AS ENUM (
    'Ingest',
    'Cull',
    'Edit',
    'Export',
    'Delivery',
    'Archive',
    'Other'
);

CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'employee',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
    project_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_name TEXT NOT NULL UNIQUE,
    client_name TEXT,
    description TEXT,
    status project_status NOT NULL DEFAULT 'Planning',
    start_time TIMESTAMPTZ NOT NULL ,
    due_time TIMESTAMPTZ NOT NULL ,
    completed_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (due_time >= start_time)
);

CREATE TABLE IF NOT EXISTS tasks(
    task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    task_category task_category NOT NULL DEFAULT 'Edit',
    description TEXT,
    status task_status NOT NULL DEFAULT 'To-Do',
    assigned_to UUID REFERENCES users(user_id) ON DELETE SET NULL,
    assigned_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    start_time TIMESTAMPTZ,
    due_time TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (completed_at >= start_time AND due_time >= start_time),
    UNIQUE (task_id, project_id)
);

