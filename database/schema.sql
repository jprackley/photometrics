CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP VIEW IF EXISTS task_progress_view CASCADE;
DROP VIEW IF EXISTS project_progress_view CASCADE;
DROP VIEW IF EXISTS assignments CASCADE;

DROP TABLE IF EXISTS time_entries CASCADE;
DROP TABLE IF EXISTS images CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS addresses CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS user_refresh_tokens CASCADE;

DROP TYPE IF EXISTS image_status CASCADE;
DROP TYPE IF EXISTS task_priority CASCADE;
DROP TYPE IF EXISTS task_category CASCADE;
DROP TYPE IF EXISTS task_status CASCADE;
DROP TYPE IF EXISTS project_status CASCADE;
DROP TYPE IF EXISTS project_priority CASCADE;
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
CREATE TYPE project_priority AS ENUM (
    'Low',
    'Normal',
    'High',
    'Urgent'
    );
CREATE TYPE task_status AS ENUM (
    'Assigned',
    'To-Do',
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
CREATE TYPE task_priority AS ENUM (
    'Low',
    'Normal',
    'High',
    'Urgent'
    );
CREATE TYPE image_status AS ENUM (
    'Pending',
    'In Progress',
    'Completed',
    'Rejected'
    );
-- To Be Commissioned
CREATE TABLE addresses
(
    address_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address_line1 VARCHAR(255)     DEFAULT NULL,
    address_line2 VARCHAR(255)     DEFAULT NULL,
    city          VARCHAR(100)     DEFAULT NULL,
    state         VARCHAR(100)     DEFAULT NULL,
    postal_code   VARCHAR(20)      DEFAULT NULL,
    country       VARCHAR(100)     DEFAULT NULL
);

CREATE TABLE users
(
    user_id             UUID PRIMARY KEY      DEFAULT gen_random_uuid(),
    employee_id         VARCHAR(100)          DEFAULT NULL,
    manager_id          VARCHAR(100)          DEFAULT NULL,

    first_name          VARCHAR(100) NOT NULL,
    middle_name         VARCHAR(100)          DEFAULT NULL,
    last_name           VARCHAR(100) NOT NULL,
    display_name        VARCHAR(100)          DEFAULT NULL,

    title               VARCHAR(100)          DEFAULT NULL,
    company             VARCHAR(100)          DEFAULT NULL,
    department          VARCHAR(100)          DEFAULT NULL,
    location            VARCHAR(100)          DEFAULT NULL,
    status              VARCHAR(100)          DEFAULT NULL,

    email               VARCHAR(255) NOT NULL UNIQUE,
    phone_number        VARCHAR(20)           DEFAULT NULL,
    website             VARCHAR(255)          DEFAULT NULL,
    notes               TEXT                  DEFAULT NULL,

    address_line1       VARCHAR(255)          DEFAULT NULL,
    address_line2       VARCHAR(255)          DEFAULT NULL,
    city                VARCHAR(100)          DEFAULT NULL,
    state               VARCHAR(100)          DEFAULT NULL,
    postal_code         VARCHAR(20)           DEFAULT NULL,
    country             VARCHAR(100)          DEFAULT NULL,

    password_hash       TEXT         NOT NULL,
    password_updated_at TIMESTAMPTZ           DEFAULT now(),
    password_expires_at TIMESTAMPTZ           DEFAULT NULL,

    last_login          TIMESTAMPTZ           DEFAULT NULL,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    account_role        user_role    NOT NULL,
    is_admin            BOOLEAN      NOT NULL DEFAULT false,
    is_active           BOOLEAN      NOT NULL DEFAULT false,

    CONSTRAINT chk_password_expires_after_update
        CHECK (password_expires_at IS NULL OR password_updated_at IS NULL OR password_expires_at >= password_updated_at)
);

CREATE TABLE user_refresh_tokens
(
    refresh_token_id UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
    user_id          UUID        NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
    token_hash       TEXT        NOT NULL UNIQUE,
    expires_at       TIMESTAMPTZ NOT NULL,
    revoked_at       TIMESTAMPTZ          DEFAULT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE settings
(
    setting_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID REFERENCES users (user_id) ON DELETE CASCADE,
    theme             VARCHAR(255)     DEFAULT 'dark',
    accentColor       VARCHAR(255)     DEFAULT '#1976d2',
    compactTables     BOOLEAN          DEFAULT false,
    showDashboardTips BOOLEAN          DEFAULT true,
    notifications     BOOLEAN          DEFAULT true,
    companyName       TEXT             DEFAULT 'Photometrics',
    language          VARCHAR(255)     DEFAULT 'en',
    timezone          VARCHAR(255)     DEFAULT 'America/New_York',
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clients
(
    client_id             UUID PRIMARY KEY      DEFAULT gen_random_uuid(),
    first_name            VARCHAR(100) NOT NULL,
    middle_name           VARCHAR(100)          DEFAULT NULL,
    last_name             VARCHAR(100)          DEFAULT NULL,
    title                 VARCHAR(100)          DEFAULT NULL,
    company_name          VARCHAR(255)          DEFAULT NULL,

    email                 VARCHAR(255) NOT NULL UNIQUE,
    phone_number          VARCHAR(20)           DEFAULT NULL,
    website               VARCHAR(255)          DEFAULT NULL,
    notes                 TEXT                  DEFAULT NULL,

    address_line1         VARCHAR(255)          DEFAULT NULL,
    address_line2         VARCHAR(255)          DEFAULT NULL,
    city                  VARCHAR(100)          DEFAULT NULL,
    state                 VARCHAR(100)          DEFAULT NULL,
    postal_code           VARCHAR(20)           DEFAULT NULL,
    country               VARCHAR(100)          DEFAULT NULL,

    billing_address_line1 VARCHAR(255)          DEFAULT NULL,
    billing_address_line2 VARCHAR(255)          DEFAULT NULL,
    billing_city          VARCHAR(100)          DEFAULT NULL,
    billing_state         VARCHAR(100)          DEFAULT NULL,
    billing_postal_code   VARCHAR(20)           DEFAULT NULL,
    billing_country       VARCHAR(100)          DEFAULT NULL,

    created_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE projects
(
    project_id   UUID PRIMARY KEY      DEFAULT gen_random_uuid(),
    client_id    UUID         REFERENCES  clients (client_id) ON DELETE SET NULL,
    managed_by   UUID         REFERENCES users (user_id) ON DELETE SET NULL,
    project_name VARCHAR(255) NOT NULL,
    description  TEXT                  DEFAULT NULL,
    status       project_status        DEFAULT 'To-Do',
    priority     project_priority      DEFAULT 'Normal',
    notes        TEXT                  DEFAULT NULL,
    start_time   TIMESTAMPTZ           DEFAULT now(),
    shoot_time   TIMESTAMPTZ           DEFAULT NULL,
    due_time     TIMESTAMPTZ           DEFAULT NULL,
    completed_at TIMESTAMPTZ           DEFAULT NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT fk_projects_client
        FOREIGN KEY (client_id)
            REFERENCES clients (client_id)
            ON DELETE SET NULL,
    CONSTRAINT fk_projects_manager
        FOREIGN KEY (managed_by)
            REFERENCES users (user_id)
            ON DELETE SET NULL,
    CONSTRAINT chk_project_due_after_start
        CHECK (due_time IS NULL OR start_time IS NULL OR due_time >= start_time)
);

CREATE TABLE tasks
(
    task_id      UUID PRIMARY KEY       DEFAULT gen_random_uuid(),
    project_id   UUID          NOT NULL,
    task_name    VARCHAR(255)  NOT NULL,
    category     task_category          DEFAULT 'Other',
    priority     task_priority          DEFAULT 'Normal',
    description  TEXT                   DEFAULT NULL,
    status       task_status            DEFAULT 'Assigned',
    progress     DECIMAL                DEFAULT 0,
    start_time   TIMESTAMPTZ            DEFAULT now(),
    total_time   DECIMAL                DEFAULT 0,
    due_time     TIMESTAMPTZ            DEFAULT NULL,
    completed_at TIMESTAMPTZ            DEFAULT NULL,
    assigned_by  UUID                   DEFAULT NULL REFERENCES users (user_id) ON DELETE SET NULL,
    assigned_to  UUID                   DEFAULT NULL REFERENCES users (user_id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT fk_tasks_project
        FOREIGN KEY (project_id)
            REFERENCES projects (project_id)
            ON DELETE CASCADE,
    CONSTRAINT chk_task_due_after_start
        CHECK (due_time IS NULL
            OR start_time IS NULL
            OR due_time >= start_time)
);

CREATE TABLE images
(
    image_id     UUID PRIMARY KEY      DEFAULT gen_random_uuid(),
    project_id   UUID         NOT NULL,
    task_id      UUID                  DEFAULT NULL,
    name         VARCHAR(255) NOT NULL DEFAULT 'Uploaded_' || CURRENT_DATE::text || '_' || gen_random_uuid()::text,
    description  TEXT                  DEFAULT NULL,
    url          TEXT                  DEFAULT NULL,
    status       image_status NOT NULL DEFAULT 'Pending',
    completed_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT fk_images_project
        FOREIGN KEY (project_id)
            REFERENCES projects (project_id)
            ON DELETE CASCADE,
    CONSTRAINT fk_images_task
        FOREIGN KEY (task_id)
            REFERENCES tasks (task_id)
            ON DELETE SET NULL
);

CREATE TABLE time_entries
(
    time_entry_id UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
    task_id       UUID        NOT NULL,
    employee_id   UUID        NOT NULL,
    start_time    TIMESTAMPTZ NOT NULL,
    end_time      TIMESTAMPTZ          DEFAULT NULL,
    total_time    DECIMAL              DEFAULT 0, -- in hours
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_time_entries_task
        FOREIGN KEY (task_id)
            REFERENCES tasks (task_id)
            ON DELETE CASCADE,
    CONSTRAINT fk_time_entries_employee
        FOREIGN KEY (employee_id)
            REFERENCES users (user_id)
            ON DELETE CASCADE,
    CONSTRAINT chk_time_entry_end_after_start
        CHECK (end_time IS NULL OR end_time >= start_time)
);

---------------------------------------------------------------------------
-- Views
---------------------------------------------------------------------------

CREATE OR REPLACE VIEW project_progress_view AS
SELECT
    p.project_id,
    p.project_name,
    COUNT(t.task_id) AS total_tasks,
    COUNT(t.status) FILTER ( WHERE t.status = 'Completed' ) AS completed_tasks,
    COALESCE(
        ROUND(
            COUNT(t.task_id) FILTER (
                WHERE t.status = 'Completed'
            )::numeric / NULLIF(COUNT(t.task_id), 0) * 100, 2
        ), 100 ) AS progress,
    p.status,
    p.due_time
FROM projects p
    LEFT JOIN tasks t ON p.project_id = t.project_id
WHERE p.status IN ('To-Do', 'In Progress', 'On Hold')
GROUP BY p.project_id, p.project_name, p.status, p.due_time
ORDER BY p.due_time DESC;

CREATE OR REPLACE VIEW assignments AS
SELECT
    t.task_id AS id,
    u.user_id AS employee_id,
    p.project_id,
    p.project_name,
    t.task_id,
    t.task_name,
    t.created_at AS assigned_date,
    t.due_time AS due_date,
    t.status AS status
FROM users u
LEFT JOIN tasks t ON u.user_id = t.assigned_to
LEFT JOIN projects p ON t.project_id = p.project_id
WHERE u.account_role = 'Employee'
ORDER BY assigned_date DESC;
---------------------------------------------------------------------------
-- HARDCODED LOGIN USERS
---------------------------------------------------------------------------
INSERT INTO users (
    first_name,
    last_name,
    display_name,
    email,
    password_hash,
    account_role,
    is_admin,
    is_active,
    status,
    company,
    department
)
VALUES (
           'Test',
           'Manager',
           'Test Manager',
           'muser@gmail.com',
           '$2b$10$B69IPafcRhsTFwnKcN/iyutVmN7rE2K0EXRa9p76zwT/fr4vaNvJy',
           'Manager',
           true,
           false,
           'Active',
           'Photometrics',
           'Operations'
       )
ON CONFLICT (email)
    DO UPDATE SET
                  first_name = EXCLUDED.first_name,
                  last_name = EXCLUDED.last_name,
                  display_name = EXCLUDED.display_name,
                  password_hash = EXCLUDED.password_hash,
                  account_role = EXCLUDED.account_role,
                  is_admin = EXCLUDED.is_admin,
                  is_active = EXCLUDED.is_active,
                  status = EXCLUDED.status,
                  company = EXCLUDED.company,
                  department = EXCLUDED.department,
                  updated_at = now();

INSERT INTO users (
    first_name,
    last_name,
    display_name,
    email,
    password_hash,
    account_role,
    is_admin,
    is_active,
    status,
    company,
    department
)
VALUES (
           'Test',
           'Employee',
           'Test Employee',
           'euser@gmail.com',
           '$2b$10$B69IPafcRhsTFwnKcN/iyutVmN7rE2K0EXRa9p76zwT/fr4vaNvJy',
           'Employee',
           false,
           false,
           'Active',
           'Photometrics',
           'Editing'
       )
ON CONFLICT (email)
    DO UPDATE SET
                  first_name = EXCLUDED.first_name,
                  last_name = EXCLUDED.last_name,
                  display_name = EXCLUDED.display_name,
                  password_hash = EXCLUDED.password_hash,
                  account_role = EXCLUDED.account_role,
                  is_admin = EXCLUDED.is_admin,
                  is_active = EXCLUDED.is_active,
                  status = EXCLUDED.status,
                  company = EXCLUDED.company,
                  department = EXCLUDED.department,
                  updated_at = now();