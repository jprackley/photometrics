ROLLBACK;
BEGIN;

-- =========================================================
-- Photometrics seed data
-- Matches database/schema.sql uploaded May 15, 2026.
-- Edit only seed_config values to change the amount of data.
-- =========================================================

CREATE TEMP TABLE seed_config (
    config_id INT PRIMARY KEY,
    manager_count INT NOT NULL,
    employee_count INT NOT NULL,
    client_count INT NOT NULL,
    project_count INT NOT NULL,
    tasks_per_project INT NOT NULL,
    images_per_project INT NOT NULL,
    time_entries_per_task INT NOT NULL,
    internal_company_name TEXT NOT NULL,
    default_password_hash TEXT NOT NULL,
    first_names TEXT[] NOT NULL,
    last_names TEXT[] NOT NULL,
    company_names TEXT[] NOT NULL,
    project_prefixes TEXT[] NOT NULL,
    project_subjects TEXT[] NOT NULL,
    task_categories task_category[] NOT NULL,
    project_statuses project_status[] NOT NULL,
    task_statuses task_status[] NOT NULL,
    image_statuses image_status[] NOT NULL
) ON COMMIT DROP;

INSERT INTO seed_config (
    config_id,
    manager_count,
    employee_count,
    client_count,
    project_count,
    tasks_per_project,
    images_per_project,
    time_entries_per_task,
    internal_company_name,
    default_password_hash,
    first_names,
    last_names,
    company_names,
    project_prefixes,
    project_subjects,
    task_categories,
    project_statuses,
    task_statuses,
    image_statuses
)
VALUES (
    1,
    4,      -- managers
    15,     -- employees
    197,    -- clients
    250,    -- projects
    10,     -- tasks per project
    900,    -- images per project
    5,      -- time entries per task
    'Photometrics',
    '$2b$10$B69IPafcRhsTFwnKcN/iyutVmN7rE2K0EXRa9p76zwT/fr4vaNvJy',
    ARRAY[
        'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey',
        'Riley', 'Jamie', 'Cameron', 'Avery', 'Quinn',
        'Parker', 'Reese', 'Dakota', 'Skyler', 'Rowan',
        'Emerson', 'Finley', 'Harper', 'Kendall', 'Logan'
    ],
    ARRAY[
        'Smith', 'Johnson', 'Williams', 'Brown', 'Jones',
        'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
        'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
        'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'
    ],
    ARRAY[
        'Aperture Studio', 'Bright Lens', 'Cedar Gallery', 'Dawn Creative', 'Evergreen Media',
        'Frame House', 'Golden Hour', 'Harbor Portraits', 'Indigo Imaging', 'Juniper Photo',
        'Keystone Studio', 'Lumen Works', 'Maple Media', 'North Star Photo', 'Oak Street Studio',
        'Pixel Forge', 'Quartz Creative', 'Riverbend Gallery', 'Silverline Media', 'True North Studio'
    ],
    ARRAY[
        'Wedding', 'Portrait', 'Event', 'Product', 'Commercial',
        'Editorial', 'Graduation', 'Family', 'Branding', 'Real Estate'
    ],
    ARRAY[
        'Photo Session', 'Image Delivery', 'Editing Workflow', 'Gallery Build', 'Client Package',
        'Campaign Assets', 'Album Production', 'Retouching Batch', 'Studio Package', 'Digital Collection'
    ],
    ARRAY['Import', 'Cull', 'Edit', 'Quality Review', 'Export', 'Delivery', 'Other']::task_category[],
    ARRAY['To-Do', 'In Progress', 'On Hold', 'Completed', 'Cancelled', 'Archived']::project_status[],
    ARRAY['To-Do', 'Assigned', 'In Progress', 'Paused', 'Completed', 'Cancelled']::task_status[],
    ARRAY['Pending', 'In Progress', 'Completed', 'Rejected']::image_status[]
);

DO $$
DECLARE
    cfg seed_config%ROWTYPE;
BEGIN
    SELECT * INTO cfg
    FROM seed_config
    WHERE config_id = 1;

    IF cfg.manager_count < 1 THEN
        RAISE EXCEPTION 'manager_count must be at least 1';
    END IF;

    IF cfg.employee_count < 1 THEN
        RAISE EXCEPTION 'employee_count must be at least 1';
    END IF;

    IF cfg.client_count < 1 THEN
        RAISE EXCEPTION 'client_count must be at least 1';
    END IF;

    IF cfg.project_count < 1 THEN
        RAISE EXCEPTION 'project_count must be at least 1';
    END IF;

    IF cfg.tasks_per_project < 1 THEN
        RAISE EXCEPTION 'tasks_per_project must be at least 1';
    END IF;

    IF cfg.images_per_project < 0 THEN
        RAISE EXCEPTION 'images_per_project cannot be negative';
    END IF;

    IF cfg.time_entries_per_task < 0 THEN
        RAISE EXCEPTION 'time_entries_per_task cannot be negative';
    END IF;
END $$;

-- Make this seed repeatable.
TRUNCATE TABLE time_entries, images, tasks, projects, clients, users CASCADE;

-- =========================================================
-- Users
-- =========================================================

WITH cfg AS (
    SELECT *
    FROM seed_config
    WHERE config_id = 1
), user_rows AS (
    SELECT
        user_num,
        CASE
            WHEN user_num <= cfg.manager_count THEN 'Manager'::user_role
            ELSE 'Employee'::user_role
        END AS account_role,
        cfg.first_names[((user_num - 1) % array_length(cfg.first_names, 1)) + 1] AS first_name,
        cfg.last_names[(((user_num - 1) / array_length(cfg.first_names, 1)) % array_length(cfg.last_names, 1)) + 1] AS last_name,
        lower(regexp_replace(cfg.internal_company_name, '[^a-zA-Z0-9]+', '', 'g')) AS company_domain,
        cfg.default_password_hash AS password_hash
    FROM cfg
    CROSS JOIN generate_series(1, cfg.manager_count + cfg.employee_count) AS user_series(user_num)
)
INSERT INTO users (
    first_name,
    last_name,
    email,
    password_hash,
    account_role
)
SELECT
    first_name,
    last_name,
    lower(first_name) || '.' || lower(last_name) || user_num || '@' || company_domain || '.com' AS email,
    password_hash,
    account_role
FROM user_rows;

-- =========================================================
-- Clients
-- =========================================================

WITH cfg AS (
    SELECT *
    FROM seed_config
    WHERE config_id = 1
), client_rows AS (
    SELECT
        client_num,
        cfg.first_names[((client_num - 1) % array_length(cfg.first_names, 1)) + 1] AS first_name,
        cfg.last_names[(((client_num - 1) / array_length(cfg.first_names, 1)) % array_length(cfg.last_names, 1)) + 1] AS last_name,
        cfg.company_names[((client_num - 1) % array_length(cfg.company_names, 1)) + 1] AS company_name
    FROM cfg
    CROSS JOIN generate_series(1, cfg.client_count) AS client_series(client_num)
)
INSERT INTO clients (
    first_name,
    last_name,
    company_name,
    email
)
SELECT
    first_name,
    last_name,
    company_name || ' ' || lpad(client_num::TEXT, 3, '0') AS company_name,
    lower(first_name) || '.' || lower(last_name) || client_num || '@client' || lpad(client_num::TEXT, 3, '0') || '.example.com' AS email
FROM client_rows;

-- =========================================================
-- Projects
-- =========================================================

WITH cfg AS (
    SELECT *
    FROM seed_config
    WHERE config_id = 1
), numbered_clients AS (
    SELECT
        client_id,
        row_number() OVER (ORDER BY created_at, client_id) AS client_num
    FROM clients
), numbered_managers AS (
    SELECT
        user_id,
        row_number() OVER (ORDER BY created_at, user_id) AS manager_num
    FROM users
    WHERE account_role = 'Manager'::user_role
), project_rows AS (
    SELECT
        project_num,
        c.client_id,
        m.user_id AS manager_id,
        cfg.project_prefixes[((project_num - 1) % array_length(cfg.project_prefixes, 1)) + 1] AS project_prefix,
        cfg.project_subjects[(((project_num - 1) / array_length(cfg.project_prefixes, 1)) % array_length(cfg.project_subjects, 1)) + 1] AS project_subject,
        cfg.project_statuses[((project_num - 1) % array_length(cfg.project_statuses, 1)) + 1] AS project_status,
        CURRENT_TIMESTAMP + ((project_num % 14) * INTERVAL '1 day') AS start_time,
        CURRENT_TIMESTAMP + ((30 + (project_num % 90)) * INTERVAL '1 day') AS due_time
    FROM cfg
    CROSS JOIN generate_series(1, cfg.project_count) AS project_series(project_num)
    JOIN numbered_clients c
        ON c.client_num = ((project_num - 1) % cfg.client_count) + 1
    JOIN numbered_managers m
        ON m.manager_num = ((project_num - 1) % cfg.manager_count) + 1
)
INSERT INTO projects (
    client_id,
    managed_by,
    project_name,
    description,
    status,
    start_time,
    due_time,
    completed_at
)
SELECT
    client_id,
    manager_id,
    project_prefix || ' ' || project_subject || ' ' || lpad(project_num::TEXT, 3, '0') AS project_name,
    'Seeded project for Photometrics dashboard workflow testing.' AS description,
    project_status,
    start_time,
    due_time,
    CASE
        WHEN project_status = 'Completed'::project_status THEN due_time - INTERVAL '1 day'
        -- ELSE NULL
    END AS completed_at
FROM project_rows;

-- =========================================================
-- Tasks
-- =========================================================

WITH cfg AS (
    SELECT *
    FROM seed_config
    WHERE config_id = 1
), numbered_projects AS (
    SELECT
        project_id,
        managed_by,
        project_name,
        start_time,
        row_number() OVER (ORDER BY created_at, project_id) AS project_num
    FROM projects
), numbered_employees AS (
    SELECT
        user_id,
        row_number() OVER (ORDER BY created_at, user_id) AS employee_num
    FROM users
    WHERE account_role = 'Employee'::user_role
), task_rows AS (
    SELECT
        p.project_id,
        p.managed_by AS assigned_by,
        e.user_id AS assigned_to,
        p.project_num,
        task_num,
        cfg.task_categories[((task_num - 1) % array_length(cfg.task_categories, 1)) + 1] AS category,
        cfg.task_statuses[((task_num - 1) % array_length(cfg.task_statuses, 1)) + 1] AS status,
        COALESCE(p.start_time, CURRENT_TIMESTAMP) + ((task_num - 1) * INTERVAL '2 days') AS start_time,
        COALESCE(p.start_time, CURRENT_TIMESTAMP) + ((task_num - 1) * INTERVAL '2 days') + INTERVAL '7 days' AS due_time,
        'Task ' || lpad(task_num::TEXT, 3, '0') || ' - ' || COALESCE(NULLIF(p.project_name, ''), p.project_id::TEXT) AS task_name
    FROM cfg
    CROSS JOIN numbered_projects p
    CROSS JOIN generate_series(1, cfg.tasks_per_project) AS task_series(task_num)
    JOIN numbered_employees e
        ON e.employee_num = (((p.project_num - 1) * cfg.tasks_per_project + task_num - 1) % cfg.employee_count) + 1
)
INSERT INTO tasks (
    project_id,
    task_name,
    category,
    description,
    status,
    start_time,
    due_time,
    completed_at,
    assigned_by,
    assigned_to
)
SELECT
    project_id,
    task_name,
    category,
    category::TEXT || ' task ' || task_num || ' for seeded project workflow testing.' AS description,
    status,
    start_time,
    due_time,
    CASE
        WHEN status = 'Completed'::task_status THEN due_time - INTERVAL '12 hours'
        --ELSE NULL
    END AS completed_at,
    assigned_by,
    assigned_to
FROM task_rows;

-- =========================================================
-- Images
-- =========================================================

WITH cfg AS (
    SELECT *
    FROM seed_config
    WHERE config_id = 1
), numbered_projects AS (
    SELECT
        project_id,
        row_number() OVER (ORDER BY created_at, project_id) AS project_num
    FROM projects
), numbered_tasks AS (
    SELECT
        task_id,
        project_id,
        row_number() OVER (PARTITION BY project_id ORDER BY created_at, task_id) AS task_num
    FROM tasks
), image_rows AS (
    SELECT
        p.project_id,
        t.task_id,
        image_num,
        cfg.image_statuses[((image_num - 1) % array_length(cfg.image_statuses, 1)) + 1] AS status
    FROM cfg
    CROSS JOIN numbered_projects p
    CROSS JOIN generate_series(1, cfg.images_per_project) AS image_series(image_num)
    JOIN numbered_tasks t
        ON t.project_id = p.project_id
       AND t.task_num = ((image_num - 1) % cfg.tasks_per_project) + 1
)
INSERT INTO images (
    project_id,
    task_id,
    name,
    url,
    status,
    completed
)
SELECT
    project_id,
    task_id,
    'image_' || replace(project_id::TEXT, '-', '') || '_' || lpad(image_num::TEXT, 4, '0') || '.jpg' AS name,
    'https://example.com/images/' || replace(project_id::TEXT, '-', '') || '/' || lpad(image_num::TEXT, 4, '0') || '.jpg' AS url,
    status,
    status = 'Completed'::image_status AS completed
FROM image_rows;

-- =========================================================
-- Time entries
-- =========================================================

WITH cfg AS (
    SELECT *
    FROM seed_config
    WHERE config_id = 1
), task_rows AS (
    SELECT
        task_id,
        assigned_to AS employee_id,
        COALESCE(start_time, CURRENT_TIMESTAMP) AS task_start_time
    FROM tasks
    WHERE assigned_to IS NOT NULL
), time_entry_rows AS (
    SELECT
        t.task_id,
        t.employee_id,
        entry_num,
        t.task_start_time + ((entry_num - 1) * INTERVAL '1 day') + INTERVAL '9 hours' AS entry_start,
        30 + ((entry_num * 25) % 210) AS minutes_worked
    FROM cfg
    CROSS JOIN task_rows t
    CROSS JOIN generate_series(1, cfg.time_entries_per_task) AS entry_series(entry_num)
)
INSERT INTO time_entries (
    task_id,
    employee_id,
    start_time,
    end_time,
    total_time
)
SELECT
    task_id,
    employee_id,
    entry_start,
    entry_start + (minutes_worked * INTERVAL '1 minute') AS end_time,
    round(minutes_worked::NUMERIC / 60.0, 2) AS total_time
FROM time_entry_rows;

COMMIT;

-- =========================================================
-- Seed summary
-- =========================================================

SELECT 'users' AS table_name, count(*) AS row_count FROM users
UNION ALL
SELECT 'clients', count(*) FROM clients
UNION ALL
SELECT 'projects', count(*) FROM projects
UNION ALL
SELECT 'tasks', count(*) FROM tasks
UNION ALL
SELECT 'images', count(*) FROM images
UNION ALL
SELECT 'time_entries', count(*) FROM time_entries
ORDER BY table_name;
