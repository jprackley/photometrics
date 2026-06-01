BEGIN;

INSERT INTO users (
    user_id,
    employee_id,
    first_name,
    last_name,
    display_name,
    title,
    company,
    department,
    location,
    status,
    email,
    phone_number,
    password_hash,
    account_role,
    is_admin,
    is_active
)
VALUES
    (
        '00000000-0000-4000-8000-000000000001',
        'EMP-001',
        'Robin',
        'Williams',
        'Employee 01',
        'Photo Editor',
        'Photometrics',
        'Editing',
        'Remote',
        'Active',
        'r.williams@gmail.com',
        '555-0102',
        '$2b$10$B69IPafcRhsTFwnKcN/iyutVmN7rE2K0EXRa9p76zwT/fr4vaNvJy',
        'Employee',
        false,
        true
    ),
    (
        '00000000-0000-4000-8000-000000000002',
        'EMP-002',
        'Bob',
        'Sagget',
        'Employee 02',
        'Photo Editor',
        'Photometrics',
        'Editing',
        'Remote',
        'Active',
        'b.sagget@gmail.com',
        '555-0102',
        '$2b$10$B69IPafcRhsTFwnKcN/iyutVmN7rE2K0EXRa9p76zwT/fr4vaNvJy',
        'Employee',
        false,
        true
    ),
    (
        '00000000-0000-4000-8000-000000000003',
        'EMP-003',
        'Jordan',
        'Editor',
        'Jordan Editor',
        'Quality Reviewer',
        'Photometrics',
        'Editing',
        'Remote',
        'Active',
        'jordan.editor@gmail.com',
        '555-0103',
        '$2b$10$B69IPafcRhsTFwnKcN/iyutVmN7rE2K0EXRa9p76zwT/fr4vaNvJy',
        'Employee',
        false,
        true
    );

INSERT INTO clients (
    client_id,
    first_name,
    last_name,
    company_name,
    email,
    phone_number,
    city,
    state,
    country,
    notes
)
VALUES
    (
        '00000000-0000-4000-8000-000000000101',
        'Alex',
        'Rivera',
        'Rivera Events',
        'alex.rivera@example.com',
        '555-0201',
        'Tampa',
        'Florida',
        'USA',
        'Wedding and event photography client'
    ),
    (
        '00000000-0000-4000-8000-000000000102',
        'Taylor',
        'Morgan',
        'Morgan Realty',
        'taylor.morgan@example.com',
        '555-0202',
        'Orlando',
        'Florida',
        'USA',
        'Real estate photography client'
    );

INSERT INTO projects (
    project_id,
    project_name,
    client_id,
    managed_by,
    description,
    status,
    priority,
    start_time,
    shoot_time,
    due_time,
    notes
)
VALUES
    (
        '10000000-0000-4000-8000-000000000101',
        'Wedding Album Editing',
        '00000000-0000-4000-8000-000000000101',
        '00000000-0000-4000-8000-000000000010',
        'Post production workflow for a wedding photography project.',
        'In Progress',
        'High',
        now(),
        now() - INTERVAL '2 days',
        now() + INTERVAL '7 days',
        'Seed project for testing task progress and dashboard views.'
    ),
    (
        '10000000-0000-4000-8000-000000000102',
        'Product Photography Retouching',
        '00000000-0000-4000-8000-000000000101',
        '00000000-0000-4000-8000-000000000010',
        'Editing and export workflow for product photography deliverables.',
        'To-Do',
        'Normal',
        now(),
        now() - INTERVAL '1 day',
        now() + INTERVAL '10 days',
        'Seed project for testing task lists and project reporting.'
    );

INSERT INTO tasks (
    task_id,
    project_id,
    task_name,
    category,
    priority,
    description,
    status,
    progress,
    start_time,
    due_time,
    completed_at,
    assigned_by,
    assigned_to
)
VALUES
    (
        '00000000-0000-4000-8000-000000000301',
        '10000000-0000-4000-8000-000000000101',
        'Import wedding gallery',
        'Import',
        'Normal',
        'Import all original wedding images',
        'Completed',
        100,
        '2026-05-01 09:00:00-06',
        '2026-05-01 12:00:00-06',
        '2026-05-01 11:30:00-06',
        '00000000-0000-4000-8000-000000000001',
        '00000000-0000-4000-8000-000000000002'
    ),
    (
        '00000000-0000-4000-8000-000000000302',
        '10000000-0000-4000-8000-000000000101',
        'Cull wedding gallery',
        'Cull',
        'High',
        'Select final images for editing',
        'In Progress',
        60,
        '2026-05-02 09:00:00-06',
        '2026-05-05 17:00:00-06',
        NULL,
        '00000000-0000-4000-8000-000000000001',
        '00000000-0000-4000-8000-000000000002'
    ),
    (
        '00000000-0000-4000-8000-000000000303',
        '10000000-0000-4000-8000-000000000101',
        'Quality review wedding gallery',
        'Quality Review',
        'High',
        'Review edited images before client delivery',
        'Assigned',
        0,
        '2026-05-06 09:00:00-06',
        '2026-05-10 17:00:00-06',
        NULL,
        '00000000-0000-4000-8000-000000000001',
        '00000000-0000-4000-8000-000000000003'
    ),
    (
        '00000000-0000-4000-8000-000000000304',
        '10000000-0000-4000-8000-000000000102',
        'Edit listing images',
        'Edit',
        'Normal',
        'Apply exposure, color, and perspective corrections',
        'To-Do',
        0,
        '2026-05-04 09:00:00-06',
        '2026-05-08 17:00:00-06',
        NULL,
        '00000000-0000-4000-8000-000000000001',
        '00000000-0000-4000-8000-000000000003'
    );

COMMIT;
