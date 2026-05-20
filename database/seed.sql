-- database/seed.sql
-- Photometrics configurable seed file
-- Adjust the constants in the CONFIG section only.

BEGIN;

DO $$
DECLARE
    ---------------------------------------------------------------------------
    -- CONFIG
    ---------------------------------------------------------------------------
    CLEAR_AUTO_SEED_DATA       CONSTANT BOOLEAN := true;

    ADDITIONAL_MANAGER_COUNT   CONSTANT INTEGER := 15;
    ADDITIONAL_EMPLOYEE_COUNT  CONSTANT INTEGER := 40;
    CLIENT_COUNT               CONSTANT INTEGER := 560;

    PROJECTS_PER_CLIENT_MIN    CONSTANT INTEGER := 1;
    PROJECTS_PER_CLIENT_MAX    CONSTANT INTEGER := 4;

    TASKS_PER_PROJECT_MIN      CONSTANT INTEGER := 5;
    TASKS_PER_PROJECT_MAX      CONSTANT INTEGER := 50;

    IMAGES_PER_PROJECT_MIN     CONSTANT INTEGER := 200;
    IMAGES_PER_PROJECT_MAX     CONSTANT INTEGER := 1000;

    TIME_ENTRIES_PER_TASK_MIN  CONSTANT INTEGER := 2;
    TIME_ENTRIES_PER_TASK_MAX  CONSTANT INTEGER := 50;

    SEED_TAG                   CONSTANT TEXT := '[seed:photometrics]';
    SEED_EMAIL_DOMAIN          CONSTANT TEXT := 'photometrics.local';

    DEFAULT_PASSWORD_HASH      CONSTANT TEXT := '$2b$10$B69IPafcRhsTFwnKcN/iyutVmN7rE2K0EXRa9p76zwT/fr4vaNvJy';

    ---------------------------------------------------------------------------
    -- FIXED USER IDS COLLECTED AFTER INSERT
    ---------------------------------------------------------------------------
    hardcoded_manager_id       UUID;
    hardcoded_employee_id      UUID;

    ---------------------------------------------------------------------------
    -- WORKING ARRAYS
    ---------------------------------------------------------------------------
    manager_ids                UUID[] := ARRAY[]::UUID[];
    employee_ids               UUID[] := ARRAY[]::UUID[];
    client_ids                 UUID[] := ARRAY[]::UUID[];

    ---------------------------------------------------------------------------
    -- LOOP VARIABLES
    ---------------------------------------------------------------------------
    i                          INTEGER;
    j                          INTEGER;
    k                          INTEGER;
    n                          INTEGER;

    client_id_value            UUID;
    project_id_value           UUID;
    task_id_value              UUID;
    image_id_value             UUID;
    user_id_value              UUID;

    project_task_ids           UUID[];

    project_count              INTEGER;
    task_count                 INTEGER;
    image_count                INTEGER;
    time_entry_count           INTEGER;

    project_start_time         TIMESTAMPTZ;
    project_due_time           TIMESTAMPTZ;
    project_completed_at       TIMESTAMPTZ;
    project_status_value       TEXT;
    project_priority_value     TEXT;

    task_start_time            TIMESTAMPTZ;
    task_due_time              TIMESTAMPTZ;
    task_completed_at          TIMESTAMPTZ;
    task_status_value          TEXT;
    task_category_value        TEXT;
    task_priority_value        TEXT;
    task_progress_value        NUMERIC;

    image_status_value         TEXT;
    image_completed_value      BOOLEAN;

    entry_start_time           TIMESTAMPTZ;
    entry_end_time             TIMESTAMPTZ;
    entry_minutes              INTEGER;

    ---------------------------------------------------------------------------
    -- ENUM VALUE LISTS
    ---------------------------------------------------------------------------
    project_statuses           TEXT[] := ARRAY[
        'To-Do',
        'In Progress',
        'On Hold',
        'Completed',
        'Cancelled',
        'Archived'
    ];

    project_priorities         TEXT[] := ARRAY[
        'Low',
        'Normal',
        'High',
        'Urgent'
    ];

    task_statuses              TEXT[] := ARRAY[
        'To-Do',
        'Assigned',
        'In Progress',
        'Paused',
        'Completed',
        'Cancelled'
    ];

    task_categories            TEXT[] := ARRAY[
        'Import',
        'Cull',
        'Edit',
        'Quality Review',
        'Export',
        'Delivery',
        'Other'
    ];

    task_priorities            TEXT[] := ARRAY[
        'Low',
        'Normal',
        'High',
        'Urgent'
    ];

    image_statuses             TEXT[] := ARRAY[
        'Pending',
        'In Progress',
        'Completed',
        'Rejected'
    ];

    client_companies           TEXT[] := ARRAY[
        'Ackley Creative Group',
        'Northstar Weddings',
        'Summit Portrait Studio',
        'Blue Ridge Events',
        'Golden Hour Media',
        'Evergreen Realty',
        'Coastal Brand House',
        'Redwood Product Co'
    ];

    project_types              TEXT[] := ARRAY[
        'Wedding Gallery',
        'Product Shoot',
        'Real Estate Listing',
        'Corporate Headshots',
        'Engagement Session',
        'Event Coverage',
        'Family Portraits',
        'Brand Campaign'
    ];
BEGIN
    ---------------------------------------------------------------------------
    -- OPTIONAL CLEANUP OF PREVIOUS GENERATED SEED DATA
    -- This does not delete the two hardcoded users.
    ---------------------------------------------------------------------------
    IF CLEAR_AUTO_SEED_DATA THEN
        DELETE FROM time_entries
        WHERE task_id IN (
            SELECT task_id
            FROM tasks
            WHERE description ILIKE '%' || SEED_TAG || '%'
        )
        OR employee_id IN (
            SELECT user_id
            FROM users
            WHERE email ILIKE 'seed.%@' || SEED_EMAIL_DOMAIN
        );

        DELETE FROM images
        WHERE description ILIKE '%' || SEED_TAG || '%'
           OR name ILIKE 'seed_%';

        DELETE FROM tasks
        WHERE description ILIKE '%' || SEED_TAG || '%'
           OR task_name ILIKE 'Seed Task %';

        DELETE FROM projects
        WHERE notes ILIKE '%' || SEED_TAG || '%'
           OR project_name ILIKE 'Seed Project %';

        DELETE FROM clients
        WHERE email ILIKE 'seed.client.%@' || SEED_EMAIL_DOMAIN;

        DELETE FROM users
        WHERE email ILIKE 'seed.%@' || SEED_EMAIL_DOMAIN;
    END IF;

    ---------------------------------------------------------------------------
    -- KEEP THESE TWO HARDCODED USERS
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
        DEFAULT_PASSWORD_HASH,
        'Manager',
        true,
        true,
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
            updated_at = now()
    RETURNING user_id INTO hardcoded_manager_id;

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
        DEFAULT_PASSWORD_HASH,
        'Employee',
        false,
        true,
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
            updated_at = now()
    RETURNING user_id INTO hardcoded_employee_id;

    manager_ids := array_append(manager_ids, hardcoded_manager_id);
    employee_ids := array_append(employee_ids, hardcoded_employee_id);

    ---------------------------------------------------------------------------
    -- ADDITIONAL MANAGERS
    ---------------------------------------------------------------------------
    IF ADDITIONAL_MANAGER_COUNT > 0 THEN
        FOR i IN 1..ADDITIONAL_MANAGER_COUNT LOOP
            INSERT INTO users (
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
                password_hash,
                account_role,
                is_admin,
                is_active,
                notes
            )
            VALUES (
                format('MGR-%03s', i),
                format('Manager%s', i),
                'Seed',
                format('Manager%s Seed', i),
                'Editing Manager',
                'Photometrics',
                'Operations',
                'Remote',
                'Active',
                format('seed.manager.%03s@%s', i, SEED_EMAIL_DOMAIN),
                DEFAULT_PASSWORD_HASH,
                'Manager',
                false,
                true,
                SEED_TAG
            )
            ON CONFLICT (email)
                DO UPDATE SET
                    first_name = EXCLUDED.first_name,
                    last_name = EXCLUDED.last_name,
                    display_name = EXCLUDED.display_name,
                    title = EXCLUDED.title,
                    company = EXCLUDED.company,
                    department = EXCLUDED.department,
                    location = EXCLUDED.location,
                    status = EXCLUDED.status,
                    password_hash = EXCLUDED.password_hash,
                    account_role = EXCLUDED.account_role,
                    is_active = EXCLUDED.is_active,
                    notes = EXCLUDED.notes,
                    updated_at = now()
            RETURNING user_id INTO user_id_value;

            manager_ids := array_append(manager_ids, user_id_value);
        END LOOP;
    END IF;

    ---------------------------------------------------------------------------
    -- ADDITIONAL EMPLOYEES
    ---------------------------------------------------------------------------
    IF ADDITIONAL_EMPLOYEE_COUNT > 0 THEN
        FOR i IN 1..ADDITIONAL_EMPLOYEE_COUNT LOOP
            INSERT INTO users (
                employee_id,
                manager_id,
                first_name,
                last_name,
                display_name,
                title,
                company,
                department,
                location,
                status,
                email,
                password_hash,
                account_role,
                is_admin,
                is_active,
                notes
            )
            VALUES (
                format('EMP-%03s', i),
                format('MGR-%03s', 1 + ((i - 1) % GREATEST(ADDITIONAL_MANAGER_COUNT, 1))),
                format('Employee%s', i),
                'Seed',
                format('Employee%s Seed', i),
                'Photo Editor',
                'Photometrics',
                'Editing',
                'Remote',
                'Active',
                format('seed.employee.%03s@%s', i, SEED_EMAIL_DOMAIN),
                DEFAULT_PASSWORD_HASH,
                'Employee',
                false,
                true,
                SEED_TAG
            )
            ON CONFLICT (email)
                DO UPDATE SET
                    employee_id = EXCLUDED.employee_id,
                    manager_id = EXCLUDED.manager_id,
                    first_name = EXCLUDED.first_name,
                    last_name = EXCLUDED.last_name,
                    display_name = EXCLUDED.display_name,
                    title = EXCLUDED.title,
                    company = EXCLUDED.company,
                    department = EXCLUDED.department,
                    location = EXCLUDED.location,
                    status = EXCLUDED.status,
                    password_hash = EXCLUDED.password_hash,
                    account_role = EXCLUDED.account_role,
                    is_active = EXCLUDED.is_active,
                    notes = EXCLUDED.notes,
                    updated_at = now()
            RETURNING user_id INTO user_id_value;

            employee_ids := array_append(employee_ids, user_id_value);
        END LOOP;
    END IF;

    ---------------------------------------------------------------------------
    -- CLIENTS
    ---------------------------------------------------------------------------
    IF CLIENT_COUNT > 0 THEN
        FOR i IN 1..CLIENT_COUNT LOOP
            INSERT INTO clients (
                first_name,
                middle_name,
                last_name,
                title,
                company_name,
                email,
                phone_number,
                website,
                notes,
                address_line1,
                address_line2,
                city,
                state,
                postal_code,
                country,
                billing_address_line1,
                billing_address_line2,
                billing_city,
                billing_state,
                billing_postal_code,
                billing_country
            )
            VALUES (
                format('Client%s', i),
                NULL,
                'Seed',
                'Owner',
                client_companies[1 + floor(random() * array_length(client_companies, 1))::INTEGER],
                format('seed.client.%03s@%s', i, SEED_EMAIL_DOMAIN),
                format('555010%04s', i),
                format('https://client-%s.example.com', i),
                SEED_TAG || ' Generated client for dashboard testing.',
                format('%s Main Street', 100 + i),
                NULL,
                'Austin',
                'Texas',
                format('78%03s', i),
                'USA',
                format('%s Billing Avenue', 200 + i),
                NULL,
                'Austin',
                'Texas',
                format('79%03s', i),
                'USA'
            )
            ON CONFLICT (email)
                DO UPDATE SET
                    first_name = EXCLUDED.first_name,
                    last_name = EXCLUDED.last_name,
                    title = EXCLUDED.title,
                    company_name = EXCLUDED.company_name,
                    phone_number = EXCLUDED.phone_number,
                    website = EXCLUDED.website,
                    notes = EXCLUDED.notes,
                    address_line1 = EXCLUDED.address_line1,
                    city = EXCLUDED.city,
                    state = EXCLUDED.state,
                    postal_code = EXCLUDED.postal_code,
                    country = EXCLUDED.country,
                    billing_address_line1 = EXCLUDED.billing_address_line1,
                    billing_city = EXCLUDED.billing_city,
                    billing_state = EXCLUDED.billing_state,
                    billing_postal_code = EXCLUDED.billing_postal_code,
                    billing_country = EXCLUDED.billing_country,
                    updated_at = now()
            RETURNING client_id INTO client_id_value;

            client_ids := array_append(client_ids, client_id_value);
        END LOOP;
    END IF;

    ---------------------------------------------------------------------------
    -- PROJECTS, TASKS, IMAGES, AND TIME ENTRIES
    ---------------------------------------------------------------------------
    FOREACH client_id_value IN ARRAY client_ids LOOP
        project_count := PROJECTS_PER_CLIENT_MIN
            + floor(random() * (PROJECTS_PER_CLIENT_MAX - PROJECTS_PER_CLIENT_MIN + 1))::INTEGER;

        FOR i IN 1..project_count LOOP
            project_status_value := project_statuses[1 + floor(random() * array_length(project_statuses, 1))::INTEGER];
            project_priority_value := project_priorities[1 + floor(random() * array_length(project_priorities, 1))::INTEGER];

            project_start_time := now() - (floor(random() * 45)::INTEGER || ' days')::INTERVAL;
            project_due_time := project_start_time + ((7 + floor(random() * 30)::INTEGER) || ' days')::INTERVAL;

            IF project_status_value = 'Completed' THEN
                project_completed_at := project_due_time - (floor(random() * 3)::INTEGER || ' days')::INTERVAL;
            ELSE
                project_completed_at := NULL;
            END IF;

            INSERT INTO projects (
                client_id,
                managed_by,
                project_name,
                description,
                status,
                priority,
                notes,
                start_time,
                shoot_time,
                due_time,
                completed_at
            )
            VALUES (
                client_id_value,
                manager_ids[1 + floor(random() * array_length(manager_ids, 1))::INTEGER],
                format(
                    'Seed Project %s %s',
                    i,
                    project_types[1 + floor(random() * array_length(project_types, 1))::INTEGER]
                ),
                SEED_TAG || ' Generated project for dashboard testing.',
                project_status_value::project_status,
                project_priority_value::project_priority,
                SEED_TAG || ' Configurable seed project.',
                project_start_time,
                project_start_time + ((1 + floor(random() * 5)::INTEGER) || ' days')::INTERVAL,
                project_due_time,
                project_completed_at
            )
            RETURNING project_id INTO project_id_value;

            project_task_ids := ARRAY[]::UUID[];

            task_count := TASKS_PER_PROJECT_MIN
                + floor(random() * (TASKS_PER_PROJECT_MAX - TASKS_PER_PROJECT_MIN + 1))::INTEGER;

            FOR j IN 1..task_count LOOP
                task_status_value := task_statuses[1 + floor(random() * array_length(task_statuses, 1))::INTEGER];
                task_category_value := task_categories[1 + floor(random() * array_length(task_categories, 1))::INTEGER];
                task_priority_value := task_priorities[1 + floor(random() * array_length(task_priorities, 1))::INTEGER];

                task_start_time := project_start_time + (floor(random() * 5)::INTEGER || ' days')::INTERVAL;
                task_due_time := LEAST(
                    project_due_time,
                    task_start_time + ((2 + floor(random() * 10)::INTEGER) || ' days')::INTERVAL
                );

                IF task_status_value = 'Completed' THEN
                    task_completed_at := task_due_time - (floor(random() * 2)::INTEGER || ' days')::INTERVAL;
                    task_progress_value := 100;
                ELSIF task_status_value IN ('In Progress', 'Paused') THEN
                    task_completed_at := NULL;
                    task_progress_value := 10 + floor(random() * 80)::INTEGER;
                ELSE
                    task_completed_at := NULL;
                    task_progress_value := floor(random() * 10)::INTEGER;
                END IF;

                INSERT INTO tasks (
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
                VALUES (
                    project_id_value,
                    format('Seed Task %s %s', j, task_category_value),
                    task_category_value::task_category,
                    task_priority_value::task_priority,
                    SEED_TAG || ' Generated task for dashboard testing.',
                    task_status_value::task_status,
                    task_progress_value,
                    task_start_time,
                    task_due_time,
                    task_completed_at,
                    manager_ids[1 + floor(random() * array_length(manager_ids, 1))::INTEGER],
                    employee_ids[1 + floor(random() * array_length(employee_ids, 1))::INTEGER]
                )
                RETURNING task_id INTO task_id_value;

                project_task_ids := array_append(project_task_ids, task_id_value);

                time_entry_count := TIME_ENTRIES_PER_TASK_MIN
                    + floor(random() * (TIME_ENTRIES_PER_TASK_MAX - TIME_ENTRIES_PER_TASK_MIN + 1))::INTEGER;

                FOR n IN 1..time_entry_count LOOP
                    entry_minutes := 20 + floor(random() * 160)::INTEGER;
                    entry_start_time := task_start_time + ((n * 3 + floor(random() * 8)::INTEGER) || ' hours')::INTERVAL;
                    entry_end_time := entry_start_time + (entry_minutes || ' minutes')::INTERVAL;

                    INSERT INTO time_entries (
                        task_id,
                        employee_id,
                        start_time,
                        end_time,
                        total_time
                    )
                    VALUES (
                        task_id_value,
                        employee_ids[1 + floor(random() * array_length(employee_ids, 1))::INTEGER],
                        entry_start_time,
                        entry_end_time,
                        round((entry_minutes / 60.0)::NUMERIC, 2)
                    );
                END LOOP;
            END LOOP;

            image_count := IMAGES_PER_PROJECT_MIN
                + floor(random() * (IMAGES_PER_PROJECT_MAX - IMAGES_PER_PROJECT_MIN + 1))::INTEGER;

            FOR k IN 1..image_count LOOP
                image_status_value := image_statuses[1 + floor(random() * array_length(image_statuses, 1))::INTEGER];
                image_completed_value := image_status_value = 'Completed';

                INSERT INTO images (
                    project_id,
                    task_id,
                    name,
                    description,
                    url,
                    status,
                    completed
                )
                VALUES (
                    project_id_value,
                    project_task_ids[1 + floor(random() * array_length(project_task_ids, 1))::INTEGER],
                    format('seed_project_%s_image_%03s.jpg', replace(project_id_value::TEXT, '-', ''), k),
                    SEED_TAG || ' Generated image for dashboard testing.',
                    format('https://example.com/photometrics/%s/image-%03s.jpg', project_id_value, k),
                    image_status_value::image_status,
                    image_completed_value
                )
                RETURNING image_id INTO image_id_value;
            END LOOP;
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Photometrics seed complete. Hardcoded manager: %, hardcoded employee: %, managers: %, employees: %, clients: %',
        hardcoded_manager_id,
        hardcoded_employee_id,
        array_length(manager_ids, 1),
        array_length(employee_ids, 1),
        array_length(client_ids, 1);
END $$;

COMMIT;
