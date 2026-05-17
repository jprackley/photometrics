CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS time_entries CASCADE;
DROP TABLE IF EXISTS images CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS image_status CASCADE;
DROP TYPE IF EXISTS task_category CASCADE;
DROP TYPE IF EXISTS task_status CASCADE;
DROP TYPE IF EXISTS project_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

CREATE TYPE user_role AS ENUM (
            'Manager',
            'Employee'
);
CREATE TYPE project_status AS ENUM (
            'To-Do',
            'In Progress',
            'On Hold',
            'Completed',
            'Cancelled',
            'Archived'
);
CREATE TYPE task_status AS ENUM (
            'To-Do',
            'Assigned',
            'In Progress',
            'Paused',
            'Completed',
            'Cancelled'
);
CREATE TYPE task_category AS ENUM (
            'Import',
            'Cull',
            'Edit',
            'Quality Review',
            'Export',
            'Delivery',
            'Other'
);
CREATE TYPE image_status AS ENUM (
            'Pending',
            'In Progress',
            'Completed',
            'Rejected'
);

CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    last_login TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    account_role user_role NOT NULL
);

CREATE TABLE IF NOT EXISTS clients (
    client_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100) DEFAULT NULL,
    last_name VARCHAR(100) NOT NULL,
    title VARCHAR(100) DEFAULT NULL,
    company_name VARCHAR(255) NOT NULL,

    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(20) DEFAULT NULL,
    website VARCHAR(255) DEFAULT NULL,
    notes TEXT DEFAULT NULL,

    address_line1 VARCHAR(255) DEFAULT NULL,
    address_line2 VARCHAR(255) DEFAULT NULL,
    city VARCHAR(100) DEFAULT NULL,
    state VARCHAR(100) DEFAULT NULL,
    postal_code VARCHAR(20) DEFAULT NULL,
    country VARCHAR(100) DEFAULT NULL,

    billing_address_line1 VARCHAR(255) DEFAULT NULL,
    billing_address_line2 VARCHAR(255) DEFAULT NULL,
    billing_city VARCHAR(100) DEFAULT NULL,
    billing_state VARCHAR(100) DEFAULT NULL,
    billing_postal_code VARCHAR(20) DEFAULT NULL,
    billing_country VARCHAR(100) DEFAULT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE projects (
    project_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL,
    managed_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    project_name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    status project_status DEFAULT 'To-Do',
    start_time TIMESTAMPTZ DEFAULT now(),
    due_time TIMESTAMPTZ DEFAULT NULL,
    completed_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_projects_client
        FOREIGN KEY (client_id)
        REFERENCES clients(client_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_projects_manager
        FOREIGN KEY (managed_by)
        REFERENCES users(user_id)
        ON DELETE SET NULL,
    CONSTRAINT chk_project_due_after_start
        CHECK (due_time IS NULL OR start_time IS NULL OR due_time >= start_time)
);

CREATE TABLE tasks (
    task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    task_name VARCHAR(255) NOT NULL,
    category task_category NOT NULL DEFAULT 'Other',
    description TEXT DEFAULT NULL,
    status task_status DEFAULT 'To-Do',
    start_time TIMESTAMPTZ DEFAULT now(),
    due_time TIMESTAMPTZ DEFAULT NULL,
    completed_at TIMESTAMPTZ DEFAULT NULL,
    assigned_by UUID DEFAULT NULL REFERENCES users(user_id) ON DELETE SET NULL,
    assigned_to UUID DEFAULT NULL REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_tasks_project
        FOREIGN KEY (project_id)
        REFERENCES projects(project_id)
        ON DELETE CASCADE,
    CONSTRAINT chk_task_due_after_start
        CHECK (due_time IS NULL
               OR start_time IS NULL
               OR due_time >= start_time)
);

CREATE TABLE images (
    image_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    task_id UUID DEFAULT NULL,
    name VARCHAR(255) DEFAULT CURRENT_DATE::text || '_' || gen_random_uuid()::text,
    description TEXT DEFAULT NULL,
    url TEXT DEFAULT NULL,
    status image_status NOT NULL DEFAULT 'Pending',
    completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_images_project
        FOREIGN KEY (project_id)
        REFERENCES projects(project_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_images_task
        FOREIGN KEY (task_id)
        REFERENCES tasks(task_id)
        ON DELETE SET NULL
);

CREATE TABLE time_entries (
    time_entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ DEFAULT NULL,
    total_time DECIMAL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_time_entries_task
        FOREIGN KEY (task_id)
        REFERENCES tasks(task_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_time_entries_employee
        FOREIGN KEY (employee_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,
    CONSTRAINT chk_time_entry_end_after_start
        CHECK (end_time IS NULL OR end_time >= start_time)
);



