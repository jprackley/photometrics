BEGIN;

-- =========================================================
-- Photometrics seed data
-- Edit only the INSERT into seed_config section to change counts.
-- This script expects schema.sql to already be run.
-- =========================================================

CREATE TEMP TABLE seed_config (
                                  config_id INT PRIMARY KEY,
                                  manager_count INT NOT NULL,
                                  employee_count INT NOT NULL,
                                  client_count INT NOT NULL,
                                  project_count INT NOT NULL,
                                  tasks_per_project INT NOT NULL,
                                  images_per_project INT NOT NULL,
                                  time_entries_per_task INT NOT NULL DEFAULT 5,
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
           4,     -- managers to create
           15,    -- employees to create
           197,    -- clients to create
           250,    -- projects to create
           10,     -- tasks per project
           900,    -- images per project
           5,     -- time entries per task
           'Photometrics',
           'seed_password_hash',
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
        available_user_name_count INT;
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

        IF cfg.time_entries_per_task <> 5 THEN
            RAISE EXCEPTION 'time_entries_per_task must be 5 for this assignment requirement';
        END IF;

        available_user_name_count := array_length(cfg.first_names, 1) * array_length(cfg.last_names, 1);

        IF cfg.manager_count + cfg.employee_count > available_user_name_count THEN
            RAISE EXCEPTION 'Not enough unique first name and last name combinations for % users. Add more names to the arrays.',
                cfg.manager_count + cfg.employee_count;
        END IF;
    END $$;

-- Make the seed file repeatable.
TRUNCATE TABLE time_entries, images, tasks, projects, clients, users CASCADE;

-- =========================================================
-- Users: managers and employees
-- Email format: firstname.lastname@companyname.com
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
    lower(first_name) || '.' || lower(last_name) || '@' || company_domain || '.com' AS email,
    password_hash,
    account_role
FROM user_rows;

-- =========================================================
-- Clients
-- Email format: firstname.lastname@companyname.com
-- Company names are numbered so client email domains stay unique.
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
    company_name,
    lower(first_name) || '.' || lower(last_name) || '@' || lower(regexp_replace(company_name, '[^a-zA-Z0-9]+', '', 'g')) || '.com' AS email
FROM client_rows;

-- =========================================================
-- Projects
-- Each project gets a random client and random manager.
-- =========================================================

WITH cfg AS (
    SELECT *
    FROM seed_config
    WHERE config_id = 1
), project_rows AS (
    SELECT
        project_num,
        client_pick.client_id,
        manager_pick.user_id AS manager_id,
        cfg.project_prefixes[1 + floor(random() * array_length(cfg.project_prefixes, 1))::INT] AS project_prefix,
        cfg.project_subjects[1 + floor(random() * array_length(cfg.project_subjects, 1))::INT] AS project_subject,
        cfg.project_statuses[1 + floor(random() * array_length(cfg.project_statuses, 1))::INT] AS project_status,
        CURRENT_TIMESTAMP + ((floor(random() * 14)::INT) * INTERVAL '1 day') AS start_time,
        CURRENT_TIMESTAMP + ((30 + floor(random() * 90)::INT) * INTERVAL '1 day') AS due_time
    FROM cfg
             CROSS JOIN generate_series(1, cfg.project_count) AS project_series(project_num)
             CROSS JOIN LATERAL (
        SELECT client_id
        FROM clients
        WHERE project_num IS NOT NULL
        ORDER BY random()
        LIMIT 1
        ) AS client_pick
             CROSS JOIN LATERAL (
        SELECT user_id
        FROM users
        WHERE account_role = 'Manager'
          AND project_num IS NOT NULL
        ORDER BY random()
        LIMIT 1
        ) AS manager_pick
)
INSERT INTO projects (
    client_id,
    manager_id,
    created_by,
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
    manager_id AS created_by,
    project_prefix || ' ' || project_subject || ' ' || lpad(project_num::TEXT, 3, '0') AS project_name,
    'Seeded project for testing dashboard, task, image, and time entry workflows.' AS description,
    project_status,
    start_time,
    due_time,
    CASE
        WHEN project_status = 'Completed' THEN due_time - INTERVAL '1 day'
        ELSE NULL
        END AS completed_at
FROM project_rows;

-- =========================================================
-- Tasks
-- Each task is assigned by the project manager and assigned to a random employee.
-- This is the schema supported way to assign employees to project work.
-- =========================================================

WITH cfg AS (
    SELECT *
    FROM seed_config
    WHERE config_id = 1
), task_rows AS (
    SELECT
        p.project_id,
        p.manager_id,
        task_num,
        employee_pick.user_id AS employee_id,
        cfg.task_categories[1 + floor(random() * array_length(cfg.task_categories, 1))::INT] AS category,
        cfg.task_statuses[1 + floor(random() * array_length(cfg.task_statuses, 1))::INT] AS task_status,
        p.start_time + ((task_num - 1) * INTERVAL '2 days') AS start_time,
        p.start_time + ((task_num - 1) * INTERVAL '2 days') + ((3 + floor(random() * 14)::INT) * INTERVAL '1 day') AS due_time
    FROM cfg
             CROSS JOIN projects p
             CROSS JOIN generate_series(1, cfg.tasks_per_project) AS task_series(task_num)
             CROSS JOIN LATERAL (
        SELECT user_id
        FROM users
        WHERE account_role = 'Employee'
          AND task_num IS NOT NULL
        ORDER BY random()
        LIMIT 1
        ) AS employee_pick
)
INSERT INTO tasks (
    project_id,
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
    category,
    category::TEXT || ' task ' || task_num || ' for seeded project workflow testing.' AS description,
    task_status,
    start_time,
    due_time,
    CASE
        WHEN task_status = 'Completed' THEN due_time - INTERVAL '12 hours'
        ELSE NULL
        END AS completed_at,
    manager_id AS assigned_by,
    employee_id AS assigned_to
FROM task_rows;

-- =========================================================
-- Images
-- Each image is connected to a random task in the same project.
-- =========================================================

WITH cfg AS (
    SELECT *
    FROM seed_config
    WHERE config_id = 1
), image_rows AS (
    SELECT
        p.project_id,
        image_num,
        task_pick.task_id,
        cfg.image_statuses[1 + floor(random() * array_length(cfg.image_statuses, 1))::INT] AS image_status
    FROM cfg
             CROSS JOIN projects p
             CROSS JOIN generate_series(1, cfg.images_per_project) AS image_series(image_num)
             CROSS JOIN LATERAL (
        SELECT task_id
        FROM tasks
        WHERE tasks.project_id = p.project_id
          AND image_num IS NOT NULL
        ORDER BY random()
        LIMIT 1
        ) AS task_pick
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
    image_status,
    image_status = 'Completed' AS completed
FROM image_rows;

-- =========================================================
-- Time entries
-- Exactly five time entries are created for each task.
-- =========================================================

WITH cfg AS (
    SELECT *
    FROM seed_config
    WHERE config_id = 1
), time_entry_rows AS (
    SELECT
        t.task_id,
        t.assigned_to AS employee_id,
        entry_num,
        t.start_time + ((entry_num - 1) * INTERVAL '1 day') + ((floor(random() * 8)::INT) * INTERVAL '1 hour') AS entry_start,
        (30 + floor(random() * 210)::INT) AS minutes_worked
    FROM cfg
             CROSS JOIN tasks t
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
