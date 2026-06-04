CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP VIEW IF EXISTS task_progress_view CASCADE;
DROP VIEW IF EXISTS project_progress_view CASCADE;
DROP VIEW IF EXISTS employee_activity_view CASCADE;
DROP VIEW IF EXISTS assignments CASCADE;
DROP VIEW IF EXISTS project_delivery_report CASCADE;
DROP VIEW IF EXISTS task_time_report CASCADE;
DROP VIEW IF EXISTS employee_productivity_report CASCADE;
DROP VIEW IF EXISTS assignment_status_report CASCADE;

DROP TABLE IF EXISTS time_entries CASCADE;
DROP TABLE IF EXISTS images CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS addresses CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS user_refresh_tokens CASCADE;

DROP TABLE IF EXISTS project_delivery_report_snapshots CASCADE;
DROP TABLE IF EXISTS task_time_report_snapshots CASCADE;
DROP TABLE IF EXISTS employee_productivity_report_snapshots CASCADE;
DROP TABLE IF EXISTS assignment_status_report_snapshots CASCADE;

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
    task_id         UUID PRIMARY KEY      DEFAULT gen_random_uuid(),
    project_id      UUID         NOT NULL,
    task_name       VARCHAR(255) NOT NULL,
    category        task_category         DEFAULT 'Other',
    priority        task_priority         DEFAULT 'Normal',
    description     TEXT                  DEFAULT NULL,
    status          task_status           DEFAULT 'Assigned',
    progress        DECIMAL               DEFAULT 0,
    start_time      TIMESTAMPTZ           DEFAULT null,
    stop_time       TIMESTAMPTZ           DEFAULT null,
    total_time      DECIMAL               DEFAULT 0,
    due_time        TIMESTAMPTZ           DEFAULT NULL,
    estimated_hours DECIMAL               DEFAULT 0,
    completed_at    TIMESTAMPTZ           DEFAULT NULL,
    assigned_by     UUID                  DEFAULT NULL REFERENCES users (user_id) ON DELETE SET NULL,
    assigned_to     UUID                  DEFAULT NULL REFERENCES users (user_id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT fk_tasks_project
        FOREIGN KEY (project_id)
            REFERENCES projects (project_id)
            ON DELETE CASCADE
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

/*CREATE TABLE time_entries
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
);*/
---------------------------------------------------------------------------
-- Report Snapshots
---------------------------------------------------------------------------
CREATE TABLE project_delivery_report_snapshots
(
    report_snapshot_id UUID PRIMARY KEY     DEFAULT gen_random_uuid(),

    project_id         UUID,
    project_name       VARCHAR(255),
    client             VARCHAR(255),

    due_date           TIMESTAMPTZ,

    total_images       INTEGER     NOT NULL DEFAULT 0,
    completed_images   INTEGER     NOT NULL DEFAULT 0,
    remaining_images   INTEGER     NOT NULL DEFAULT 0,

    progress           NUMERIC(5, 2),

    project_status     VARCHAR(50),
    due_status         VARCHAR(50),

    open_tasks         INTEGER     NOT NULL DEFAULT 0,
    review_items       INTEGER     NOT NULL DEFAULT 0,
    assigned_employees TEXT[]      NOT NULL DEFAULT ARRAY[]::text[],

    generated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE task_time_report_snapshots
(
    report_snapshot_id UUID PRIMARY KEY         DEFAULT gen_random_uuid(),
    task_id            UUID         NOT NULL,
    task_name          VARCHAR(255) NOT NULL,
    project            VARCHAR(255) NOT NULL,

    assigned_employee  VARCHAR(511) NOT NULL,

    due_date           TIMESTAMPTZ              DEFAULT NULL,
    priority           TEXT         NOT NULL,
    estimated_hours    DECIMAL(10, 2)           DEFAULT NULL,

    tracked_time       DECIMAL(10, 2)           DEFAULT NULL,

    utilization        DECIMAL(10, 2)           DEFAULT NULL,
    status             TEXT                     DEFAULT NULL,
    due_status         TEXT                     DEFAULT NULL,

    generated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE employee_productivity_report_snapshots
(
    report_snapshot_id UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
    user_id            UUID,
    employee_name      TEXT,
    role               TEXT,
    assigned_items     INTEGER,
    completed_items    INTEGER,
    review_items       INTEGER,
    tracked_time       DECIMAL,
    --hours_today,
    efficiency         DECIMAL,
    status             TEXT,

    generated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE assignment_status_report_snapshots
(
    report_snapshot_id UUID PRIMARY KEY     DEFAULT gen_random_uuid(),

    task_id            UUID        NOT NULL,
    project            TEXT        NOT NULL,
    category           TEXT        NOT NULL,
    assigned_employee  TEXT        NOT NULL,
    assigned_date      TIMESTAMPTZ NOT NULL,
    due_date           TIMESTAMPTZ NOT NULL,
    priority           TEXT        NOT NULL,
    status             TEXT        NOT NULL,
    due_status         TEXT        NOT NULL,

    generated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

---------------------------------------------------------------------------
-- Report Views
---------------------------------------------------------------------------
CREATE OR REPLACE VIEW project_delivery_report AS
WITH image_counts AS (
    SELECT
        project_id,
        COUNT(image_id) AS total_images,
        COUNT(image_id) FILTER (
            WHERE status = 'Completed'
            ) AS completed_images,
        COUNT(image_id) FILTER (
            WHERE status <> 'Completed'
            ) AS remaining_images,
        COALESCE(
                ROUND(
                                COUNT(image_id) FILTER (
                            WHERE status = 'Completed'
                            )::numeric / NULLIF(COUNT(image_id), 0) * 100, 2
                ), 100 ) AS progress
    FROM images
    GROUP BY project_id
),

     task_counts AS (
         SELECT
             project_id,
             COUNT(task_id) FILTER (
                 WHERE status <> 'Completed'
                     AND status <> 'Cancelled'
                 ) AS open_tasks,
             COUNT(task_id) FILTER (
                 WHERE category = 'Quality Review'
                     AND (status <> 'Completed' AND status <> 'Cancelled')
                 ) AS review_items
         FROM tasks
         GROUP BY project_id
     ),

     assigned_employees AS (
         SELECT
             project_id,
             ARRAY_AGG(
             DISTINCT CONCAT(u.first_name, ' ', u.last_name)
                      ) FILTER ( WHERE u.account_role = 'Employee' )
                 AS assigned_employees
         FROM tasks t
                  LEFT JOIN users u
                            ON t.assigned_to = u.user_id
         GROUP BY project_id
     )


SELECT
    p.project_id,
    p.project_name,
    COALESCE(
            NULLIF(c.company_name, ''),
            CONCAT_WS(' ', c.first_name, c.last_name)
    ) AS client,

    p.due_time AS due_date,

    CASE
        WHEN p.status = 'Completed' THEN 'Completed'
        WHEN p.due_time IS NULL THEN NULL
        WHEN p.due_time < NOW() THEN 'Overdue'
        WHEN p.due_time <= NOW() + INTERVAL '7 days' THEN 'Due Soon'
        ELSE 'On Track'
        END AS due_status,

    COALESCE(ic.total_images, 0) AS total_images,
    COALESCE(ic.completed_images, 0) AS completed_images,
    COALESCE(ic.remaining_images, 0) AS remaining_images,
    COALESCE(ic.progress, 0) AS progress,

    p.status,

    COALESCE(tc.open_tasks, 0) AS open_tasks,
    COALESCE(tc.review_items, 0) AS review_items,

    COALESCE(ae.assigned_employees, ARRAY[]::text[]) AS assigned_employees

FROM projects p
         LEFT JOIN clients c
                   ON p.client_id = c.client_id
         LEFT JOIN image_counts ic
                   ON p.project_id = ic.project_id
         LEFT JOIN task_counts tc
                   ON p.project_id = tc.project_id
         LEFT JOIN assigned_employees ae
                   ON p.project_id = ae.project_id

ORDER BY due_date DESC;

CREATE OR REPLACE VIEW task_time_report AS
SELECT
    t.task_id,
    t.task_name,
    p.project_name AS project,

    CASE
        WHEN u.account_role = 'Employee'
            THEN CONCAT_WS(' ', u.first_name, u.last_name)
        END AS assigned_employee,

    t.due_time AS due_date,
    t.priority,
    t.estimated_hours,

    COALESCE(t.total_time, 0) AS tracked_time,

    CASE
        WHEN t.estimated_hours IS NULL OR t.estimated_hours = 0 THEN NULL
        ELSE ROUND(
                (COALESCE(t.total_time, 0)::numeric / t.estimated_hours::numeric) * 100,
                2
             )
        END AS utilization,

    t.status,

    CASE
        WHEN t.status = 'Completed' THEN 'Completed'
        WHEN t.due_time IS NULL THEN NULL
        WHEN t.due_time < NOW() THEN 'Overdue'
        WHEN t.due_time <= NOW() + INTERVAL '7 days' THEN 'Due Soon'
        ELSE 'On Track'
        END AS due_status

FROM tasks t
         LEFT JOIN projects p
                   ON t.project_id = p.project_id
         LEFT JOIN users u
                   ON t.assigned_to = u.user_id;


CREATE OR REPLACE VIEW employee_productivity_report AS
SELECT DISTINCT u.user_id,
       concat(u.first_name, ' ', u.last_name) AS employee_name,
       u.account_role AS role,

       COUNT(t.task_id) FILTER (
           WHERE t.status <> 'Completed'
           AND t.status <> 'Cancelled'
           ) AS assigned_items,

       COUNT(t.task_id) FILTER (
           WHERE t.status = 'Completed'
           ) AS completed_items,

       COUNT(t.task_id) FILTER (
           WHERE t.category = 'Quality Review'
           AND ( t.status <> 'Completed' AND t.status <> 'Cancelled' )
           ) AS review_items,

       COALESCE(
            SUM(
                CASE
                    WHEN t.start_time IS NOT NULL
                    AND t.stop_time IS NULL
                    AND COALESCE(t.total_time, 0) = 0
                    THEN EXTRACT(EPOCH FROM (NOW() - t.start_time)) / 3600 --Hours
                    ELSE COALESCE(t.total_time, 0)
                END
            ), 0
       ) AS tracked_time,

       --hours_today,

       ROUND( COALESCE(
                  SUM(t.estimated_hours)::numeric /
                      NULLIF(SUM( COALESCE(t.total_time, 0) ), 0) * 100,
       0 ), 2 ) AS efficiency,

       u.status

FROM users u
         LEFT JOIN tasks t ON u.user_id = t.assigned_to
WHERE u.account_role = 'Employee'
GROUP BY user_id;

CREATE OR REPLACE VIEW
    assignment_status_report AS
SELECT t.task_id,
       p.project_name                         AS project,
       t.category,
       CONCAT(u.first_name, ' ', u.last_name) AS assigned_employee,
       t.created_at                           AS assigned_date,
       t.due_time                             AS due_date,
       t.priority,
       t.status,
       CASE
           WHEN t.status = 'Completed' THEN 'Completed'
           WHEN t.due_time IS NULL THEN NULL
           WHEN t.due_time < NOW() THEN 'Overdue'
           WHEN t.due_time <= NOW() + INTERVAL '7 days' THEN 'Due Soon'
           ELSE 'On Track'
           END                                AS due_status
FROM tasks t
         LEFT JOIN projects p
                   ON t.project_id = p.project_id
         LEFT JOIN users u
                   ON t.assigned_to = u.user_id;

---------------------------------------------------------------------------
-- Views
---------------------------------------------------------------------------
CREATE or REPLACE VIEW employee_activity_view AS
SELECT u.user_id,
       p.project_id,
       p.project_name,
       t.task_id,
       t.task_name,
       t.status,
       t.category,
       u.first_name,
       u.middle_name,
       u.last_name,
       u.display_name,
       concat(u.first_name, ' ', u.last_name, ' is assigned ', t.task_name,' for Project ', p.project_name,'.',
              E'.\nAssigned Task updated at: ', t.updated_at,
              E'.\nStatus: ', t.status) AS description,
       t.updated_at
FROM users u
         LEFT JOIN tasks t ON t.assigned_to = u.user_id
         LEFT JOIN projects p ON p.project_id = t.project_id
WHERE u.account_role = 'Employee'
GROUP BY u.user_id,
         t.task_id,
         t.updated_at,
         t.task_name,
         t.category,
         t.status,
         p.project_name,
         p.project_id

ORDER BY t.updated_at DESC;

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
    user_id,
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
           '00000000-0000-4000-8000-000000000010',
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
    user_id,
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
           '00000000-0000-4000-8000-000000000011',
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