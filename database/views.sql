DROP VIEW IF EXISTS project_delivery_report CASCADE;
DROP VIEW IF EXISTS task_time_report CASCADE;
DROP VIEW IF EXISTS employee_productivity_report CASCADE;
DROP VIEW IF EXISTS assignment_status_report CASCADE;
DROP VIEW IF EXISTS task_progress_view CASCADE;
DROP VIEW IF EXISTS project_progress_view CASCADE;
DROP VIEW IF EXISTS employee_activity_view CASCADE;
DROP VIEW IF EXISTS assignments CASCADE;


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
