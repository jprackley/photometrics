BEGIN;

TRUNCATE TABLE
    time_entries,
    images,
    tasks,
    projects,
    clients,
    users,
    addresses
RESTART IDENTITY CASCADE;

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
        'Test',
        'Manager',
        'Test Manager',
        'Operations Manager',
        'Photometrics',
        'Operations',
        'Remote',
        'Active',
        'muser@gmail.com',
        '555-0101',
        '$2b$10$B69IPafcRhsTFwnKcN/iyutVmN7rE2K0EXRa9p76zwT/fr4vaNvJy',
        'Manager',
        true,
        true
    ),
    (
        '00000000-0000-4000-8000-000000000002',
        'EMP-002',
        'Test',
        'Employee',
        'Test Employee',
        'Photo Editor',
        'Photometrics',
        'Editing',
        'Remote',
        'Active',
        'euser@gmail.com',
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
    client_id,
    managed_by,
    project_name,
    description,
    status,
    priority,
    notes,
    start_time,
    shoot_time,
    due_time
)
VALUES
    (
        '00000000-0000-4000-8000-000000000201',
        '00000000-0000-4000-8000-000000000101',
        '00000000-0000-4000-8000-000000000001',
        'Rivera Wedding Photo Edit',
        'Full editing workflow for wedding photo delivery',
        'In Progress',
        'High',
        'Client requested warm color grading',
        '2026-05-01 09:00:00-06',
        '2026-05-02 14:00:00-06',
        '2026-05-15 17:00:00-06'
    ),
    (
        '00000000-0000-4000-8000-000000000202',
        '00000000-0000-4000-8000-000000000102',
        '00000000-0000-4000-8000-000000000001',
        'Morgan Realty Listing Photos',
        'Edit and deliver real estate listing images',
        'To-Do',
        'Normal',
        'Standard real estate editing package',
        '2026-05-03 09:00:00-06',
        '2026-05-04 10:00:00-06',
        '2026-05-10 17:00:00-06'
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
        '00000000-0000-4000-8000-000000000201',
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
        '00000000-0000-4000-8000-000000000201',
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
        '00000000-0000-4000-8000-000000000201',
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
        '00000000-0000-4000-8000-000000000202',
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

INSERT INTO images (
    image_id,
    project_id,
    task_id,
    name,
    description,
    url,
    status,
    completed_at
)
VALUES
    (
        '00000000-0000-4000-8000-000000000401',
        '00000000-0000-4000-8000-000000000201',
        '00000000-0000-4000-8000-000000000301',
        'wedding_001.jpg',
        'Bride and groom portrait',
        'https://example.com/images/wedding_001.jpg',
        'Completed',
        '2026-05-01 11:30:00-06'
    ),
    (
        '00000000-0000-4000-8000-000000000402',
        '00000000-0000-4000-8000-000000000201',
        '00000000-0000-4000-8000-000000000302',
        'wedding_002.jpg',
        'Reception detail shot',
        'https://example.com/images/wedding_002.jpg',
        'In Progress',
        NULL
    ),
    (
        '00000000-0000-4000-8000-000000000403',
        '00000000-0000-4000-8000-000000000202',
        '00000000-0000-4000-8000-000000000304',
        'listing_001.jpg',
        'Front exterior listing photo',
        'https://example.com/images/listing_001.jpg',
        'Pending',
        NULL
    );

INSERT INTO time_entries (
    time_entry_id,
    task_id,
    employee_id,
    start_time,
    end_time,
    total_time
)
VALUES
    (
        '00000000-0000-4000-8000-000000000501',
        '00000000-0000-4000-8000-000000000301',
        '00000000-0000-4000-8000-000000000002',
        '2026-05-01 09:00:00-06',
        '2026-05-01 11:30:00-06',
        150
    ),
    (
        '00000000-0000-4000-8000-000000000502',
        '00000000-0000-4000-8000-000000000302',
        '00000000-0000-4000-8000-000000000002',
        '2026-05-02 09:00:00-06',
        '2026-05-02 13:00:00-06',
        240
    ),
    (
        '00000000-0000-4000-8000-000000000503',
        '00000000-0000-4000-8000-000000000302',
        '00000000-0000-4000-8000-000000000002',
        '2026-05-03 10:00:00-06',
        '2026-05-03 12:00:00-06',
        120
    ),
    (
        '00000000-0000-4000-8000-000000000504',
        '00000000-0000-4000-8000-000000000304',
        '00000000-0000-4000-8000-000000000003',
        '2026-05-04 09:00:00-06',
        '2026-05-04 10:30:00-06',
        90
    );

COMMIT;
