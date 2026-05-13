BEGIN;

CREATE TEMP TABLE seed_config (
    client_count INTEGER NOT NULL,
    manager_count INTEGER NOT NULL,
    employee_count INTEGER NOT NULL,
    project_count INTEGER NOT NULL,
    tasks_per_project INTEGER NOT NULL,
    images_per_project INTEGER NOT NULL,
    time_entries_per_user INTEGER NOT NULL,
    seed_start_time TIMESTAMPTZ NOT NULL,
    due_offset INTERVAL NOT NULL
) ON COMMIT DROP;

INSERT INTO seed_config (
    client_count,
    manager_count,
    employee_count,
    project_count,
    tasks_per_project,
    images_per_project,
    time_entries_per_user,
    seed_start_time,
    due_offset
)
VALUES (
    20,                          -- clients
    4,                         -- managers
    15,                       -- employees
    20,                         -- projects, one per client
    5,                       -- tasks per project
    20,                     -- images per project
    5,                    -- time entries per user
    TIMESTAMPTZ '2026-05-01 09:00:00-06',
    INTERVAL '3 months'
);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM seed_config
        WHERE project_count > client_count
    ) THEN
        RAISE EXCEPTION 'project_count cannot be greater than client_count because this seed creates one project per client.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM seed_config
        WHERE project_count > 0
          AND manager_count < 1
    ) THEN
        RAISE EXCEPTION 'manager_count must be at least 1 when project_count is greater than 0.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM seed_config
        WHERE project_count > 0
          AND tasks_per_project > 0
          AND employee_count < 1
    ) THEN
        RAISE EXCEPTION 'employee_count must be at least 1 when tasks are being created.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM seed_config
        WHERE time_entries_per_user > 0
          AND project_count * tasks_per_project < 1
    ) THEN
        RAISE EXCEPTION 'At least one task is required when time entries are being created.';
    END IF;
END $$;

TRUNCATE TABLE
    time_entries,
    images,
    tasks,
    projects,
    clients,
    users
    RESTART IDENTITY CASCADE;

INSERT INTO users (
    user_id,
    first_name,
    last_name,
    email,
    password_hash,
    account_role
)
SELECT
    (
        '00000000-0000-0000-0000-' ||
        LPAD(manager_num::TEXT, 12, '0')
    )::UUID AS user_id,
    'Manager' || manager_num AS first_name,
    'User' AS last_name,
    'manager' || LPAD(manager_num::TEXT, 2, '0') || '@photometrics.dev' AS email,
    '00000000-0000-0000-0000-000000000001' AS password_hash,
    'Manager'::user_role AS account_role
FROM seed_config cfg
CROSS JOIN GENERATE_SERIES(1, cfg.manager_count) AS gs(manager_num);

INSERT INTO users (
    user_id,
    first_name,
    last_name,
    email,
    password_hash,
    account_role
)
SELECT
    (
        '00000000-0000-0000-0000-' ||
        LPAD((cfg.manager_count + employee_num)::TEXT, 12, '0')
    )::UUID AS user_id,
    'Employee' || employee_num AS first_name,
    'User' AS last_name,
    'employee' || LPAD(employee_num::TEXT, 2, '0') || '@photometrics.dev' AS email,
    '00000000-0000-0000-0000-000000000001' AS password_hash,
    'Employee'::user_role AS account_role
FROM seed_config cfg
CROSS JOIN GENERATE_SERIES(1, cfg.employee_count) AS gs(employee_num);

INSERT INTO clients (
    client_id,
    first_name,
    last_name,
    company_name,
    email
)
SELECT
    (
        '00000000-0000-0000-0000-' ||
        LPAD((100 + client_num)::TEXT, 12, '0')
    )::UUID AS client_id,
    'Client' || client_num AS first_name,
    'Contact' AS last_name,
    'Client Company ' || LPAD(client_num::TEXT, 2, '0') AS company_name,
    'client' || LPAD(client_num::TEXT, 2, '0') || '@example.com' AS email
FROM seed_config cfg
CROSS JOIN GENERATE_SERIES(1, cfg.client_count) AS gs(client_num);

INSERT INTO projects (
    project_id,
    client_id,
    manager_id,
    created_by,
    project_name,
    description,
    status,
    start_time,
    due_time
)
SELECT
    (
        '00000000-0000-0000-0000-' ||
        LPAD((1000 + project_num)::TEXT, 12, '0')
    )::UUID AS project_id,

    (
        '00000000-0000-0000-0000-' ||
        LPAD((100 + project_num)::TEXT, 12, '0')
    )::UUID AS client_id,

    (
        '00000000-0000-0000-0000-' ||
        LPAD((((project_num - 1) % cfg.manager_count) + 1)::TEXT, 12, '0')
    )::UUID AS manager_id,

    (
        '00000000-0000-0000-0000-' ||
        LPAD((((project_num - 1) % cfg.manager_count) + 1)::TEXT, 12, '0')
    )::UUID AS created_by,

    'PROJECT-' || LPAD(project_num::TEXT, 3, '0') AS project_name,
    'Generated seed project ' || project_num AS description,
    'To-Do'::project_status AS status,
    cfg.seed_start_time + ((project_num - 1) * INTERVAL '1 day') AS start_time,
    cfg.seed_start_time + ((project_num - 1) * INTERVAL '1 day') + cfg.due_offset AS due_time
FROM seed_config cfg
CROSS JOIN GENERATE_SERIES(1, cfg.project_count) AS gs(project_num);

INSERT INTO tasks (
    task_id,
    project_id,
    category,
    description,
    status,
    start_time,
    due_time,
    completed_at,
    assigned_by,
    assigned_to,
    created_at,
    updated_at
)
WITH task_rows AS (
    SELECT
        cfg.manager_count,
        cfg.employee_count,
        cfg.seed_start_time,
        cfg.due_offset,
        project_num,
        task_num,
        ((project_num - 1) * cfg.tasks_per_project + task_num) AS task_num_global
    FROM seed_config cfg
    CROSS JOIN GENERATE_SERIES(1, cfg.project_count) AS p(project_num)
    CROSS JOIN GENERATE_SERIES(1, cfg.tasks_per_project) AS t(task_num)
),
calculated_tasks AS (
    SELECT
        *,
        seed_start_time
            + ((project_num - 1) * INTERVAL '1 day')
            + ((task_num - 1) * INTERVAL '4 hours') AS calculated_start_time
    FROM task_rows
)
SELECT
    (
        '00000000-0000-0000-0000-' ||
        LPAD((2000 + task_num_global)::TEXT, 12, '0')
    )::UUID AS task_id,

    (
        '00000000-0000-0000-0000-' ||
        LPAD((1000 + project_num)::TEXT, 12, '0')
    )::UUID AS project_id,

    CASE ((task_num - 1) % 7) + 1
        WHEN 1 THEN 'Import'::task_category
        WHEN 2 THEN 'Cull'::task_category
        WHEN 3 THEN 'Edit'::task_category
        WHEN 4 THEN 'Quality Review'::task_category
        WHEN 5 THEN 'Export'::task_category
        WHEN 6 THEN 'Delivery'::task_category
        ELSE 'Other'::task_category
    END AS category,

    CASE ((task_num - 1) % 7) + 1
        WHEN 1 THEN 'Import project files'
        WHEN 2 THEN 'Cull unusable images'
        WHEN 3 THEN 'Edit selected images'
        WHEN 4 THEN 'Perform quality review'
        WHEN 5 THEN 'Export final images'
        WHEN 6 THEN 'Deliver completed gallery'
        ELSE 'Other project task'
    END AS description,

    CASE ((task_num - 1) % 5) + 1
        WHEN 1 THEN 'Completed'::task_status
        WHEN 2 THEN 'In Progress'::task_status
        WHEN 3 THEN 'Assigned'::task_status
        ELSE 'To-Do'::task_status
    END AS status,

    calculated_start_time AS start_time,
    calculated_start_time + due_offset AS due_time,

    CASE
        WHEN ((task_num - 1) % 5) + 1 = 1 THEN calculated_start_time + INTERVAL '1 day'
        ELSE NULL
    END AS completed_at,

    (
        '00000000-0000-0000-0000-' ||
        LPAD((((project_num - 1) % manager_count) + 1)::TEXT, 12, '0')
    )::UUID AS assigned_by,

    (
        '00000000-0000-0000-0000-' ||
        LPAD((manager_count + (((task_num_global - 1) % employee_count) + 1))::TEXT, 12, '0')
    )::UUID AS assigned_to,

    CURRENT_TIMESTAMP AS created_at,
    CURRENT_TIMESTAMP AS updated_at
FROM calculated_tasks;

INSERT INTO images (
    image_id,
    project_id,
    task_id,
    name,
    url,
    status,
    completed,
    created_at,
    updated_at
)
WITH image_rows AS (
    SELECT
        cfg.tasks_per_project,
        project_num,
        image_num,
        ((project_num - 1) * cfg.images_per_project + image_num) AS image_num_global,
        CASE
            WHEN cfg.tasks_per_project > 0 THEN ((image_num - 1) % cfg.tasks_per_project) + 1
            ELSE NULL
        END AS task_num_for_image
    FROM seed_config cfg
    CROSS JOIN GENERATE_SERIES(1, cfg.project_count) AS p(project_num)
    CROSS JOIN GENERATE_SERIES(1, cfg.images_per_project) AS i(image_num)
)
SELECT
    (
        '00000000-0000-0000-0000-' ||
        LPAD((3000 + image_num_global)::TEXT, 12, '0')
    )::UUID AS image_id,

    (
        '00000000-0000-0000-0000-' ||
        LPAD((1000 + project_num)::TEXT, 12, '0')
    )::UUID AS project_id,

    CASE
        WHEN task_num_for_image IS NULL THEN NULL
        ELSE (
            '00000000-0000-0000-0000-' ||
            LPAD((2000 + ((project_num - 1) * tasks_per_project + task_num_for_image))::TEXT, 12, '0')
        )::UUID
    END AS task_id,

    'project_' ||
    LPAD(project_num::TEXT, 3, '0') ||
    '_image_' ||
    LPAD(image_num::TEXT, 3, '0') ||
    '.jpg' AS name,

    'https://example.com/images/project_' ||
    LPAD(project_num::TEXT, 3, '0') ||
    '/image_' ||
    LPAD(image_num::TEXT, 3, '0') ||
    '.jpg' AS url,

    CASE
        WHEN image_num % 20 <= 8 AND image_num % 20 <> 0 THEN 'Completed'::image_status
        WHEN image_num % 20 <= 14 AND image_num % 20 <> 0 THEN 'In Progress'::image_status
        WHEN image_num % 20 <= 18 AND image_num % 20 <> 0 THEN 'Pending'::image_status
        ELSE 'Rejected'::image_status
    END AS status,

    CASE
        WHEN image_num % 20 <= 8 AND image_num % 20 <> 0 THEN TRUE
        ELSE FALSE
    END AS completed,

    CURRENT_TIMESTAMP AS created_at,
    CURRENT_TIMESTAMP AS updated_at
FROM image_rows;

INSERT INTO time_entries (
    time_entry_id,
    task_id,
    employee_id,
    start_time,
    end_time,
    total_time,
    created_at
)
WITH time_entry_rows AS (
    SELECT
        cfg.manager_count,
        cfg.employee_count,
        cfg.project_count,
        cfg.tasks_per_project,
        cfg.seed_start_time,
        user_num,
        entry_num,
        ((user_num - 1) * cfg.time_entries_per_user + entry_num) AS time_entry_num
    FROM seed_config cfg
    CROSS JOIN GENERATE_SERIES(1, cfg.manager_count + cfg.employee_count) AS u(user_num)
    CROSS JOIN GENERATE_SERIES(1, cfg.time_entries_per_user) AS e(entry_num)
),
calculated_time_entries AS (
    SELECT
        *,
        seed_start_time + ((time_entry_num - 1) * INTERVAL '6 hours') AS calculated_start_time,
        ((project_count * tasks_per_project)) AS total_task_count
    FROM time_entry_rows
)
SELECT
    (
        '00000000-0000-0000-0000-' ||
        LPAD((5000 + time_entry_num)::TEXT, 12, '0')
    )::UUID AS time_entry_id,

    (
        '00000000-0000-0000-0000-' ||
        LPAD((2000 + (((time_entry_num - 1) % total_task_count) + 1))::TEXT, 12, '0')
    )::UUID AS task_id,

    (
        '00000000-0000-0000-0000-' ||
        LPAD(user_num::TEXT, 12, '0')
    )::UUID AS employee_id,

    calculated_start_time AS start_time,

    calculated_start_time +
    CASE entry_num
        WHEN 1 THEN INTERVAL '1 hour'
        WHEN 2 THEN INTERVAL '1.5 hours'
        WHEN 3 THEN INTERVAL '2 hours'
        WHEN 4 THEN INTERVAL '2.5 hours'
        ELSE INTERVAL '3 hours'
    END AS end_time,

    CASE entry_num
        WHEN 1 THEN 1.00
        WHEN 2 THEN 1.50
        WHEN 3 THEN 2.00
        WHEN 4 THEN 2.50
        ELSE 3.00
    END AS total_time,

    CURRENT_TIMESTAMP AS created_at
FROM calculated_time_entries;

SELECT
    (SELECT client_count FROM seed_config) AS configured_clients,
    (SELECT COUNT(*) FROM clients) AS inserted_clients,
    (SELECT manager_count FROM seed_config) AS configured_managers,
    (SELECT COUNT(*) FROM users WHERE account_role = 'Manager') AS inserted_managers,
    (SELECT employee_count FROM seed_config) AS configured_employees,
    (SELECT COUNT(*) FROM users WHERE account_role = 'Employee') AS inserted_employees,
    (SELECT project_count FROM seed_config) AS configured_projects,
    (SELECT COUNT(*) FROM projects) AS inserted_projects,
    (SELECT project_count * tasks_per_project FROM seed_config) AS configured_tasks,
    (SELECT COUNT(*) FROM tasks) AS inserted_tasks,
    (SELECT project_count * images_per_project FROM seed_config) AS configured_images,
    (SELECT COUNT(*) FROM images) AS inserted_images,
    (SELECT (manager_count + employee_count) * time_entries_per_user FROM seed_config) AS configured_time_entries,
    (SELECT COUNT(*) FROM time_entries) AS inserted_time_entries;

COMMIT;
