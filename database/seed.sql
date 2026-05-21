-- database/seed.sql
-- Photometrics seed file generated from schema(6).sql

BEGIN;

DO $$
DECLARE
    ---------------------------------------------------------------------------
    -- CONFIG
    ---------------------------------------------------------------------------
    CLEAR_AUTO_SEED_DATA      CONSTANT BOOLEAN := true;
    ADDITIONAL_MANAGER_COUNT  CONSTANT INTEGER := 10;
    ADDITIONAL_EMPLOYEE_COUNT CONSTANT INTEGER := 50;
    CLIENT_COUNT              CONSTANT INTEGER := 70;
    PROJECTS_PER_CLIENT       CONSTANT INTEGER := 2;
    TASKS_PER_PROJECT         CONSTANT INTEGER := 12;
    IMAGES_PER_PROJECT        CONSTANT INTEGER := 450;
    TIME_ENTRIES_PER_TASK     CONSTANT INTEGER := 50;

    SEED_TAG                  CONSTANT TEXT := '[seed:photometrics]';
    SEED_EMAIL_DOMAIN         CONSTANT TEXT := 'photometrics.local';


    ---------------------------------------------------------------------------
    -- IDS
    ---------------------------------------------------------------------------
    hardcoded_manager_id      UUID;
    hardcoded_employee_id     UUID;
    user_id_value             UUID;
    client_id_value           UUID;
    project_id_value          UUID;
    task_id_value             UUID;

    manager_ids               UUID[] := ARRAY[]::UUID[];
    employee_ids              UUID[] := ARRAY[]::UUID[];
    client_ids                UUID[] := ARRAY[]::UUID[];
    project_task_ids          UUID[] := ARRAY[]::UUID[];

    ---------------------------------------------------------------------------
    -- LOOP COUNTERS
    ---------------------------------------------------------------------------
    i                         INTEGER;
    j                         INTEGER;
    k                         INTEGER;
    n                         INTEGER;
    project_counter           INTEGER := 0;
    task_counter              INTEGER := 0;
    image_counter             INTEGER := 0;

    ---------------------------------------------------------------------------
    -- DATES AND STATUS VALUES
    ---------------------------------------------------------------------------
    project_start_time        TIMESTAMPTZ;
    project_shoot_time        TIMESTAMPTZ;
    project_due_time          TIMESTAMPTZ;
    project_completed_at      TIMESTAMPTZ;
    project_status_value      TEXT;
    project_priority_value    TEXT;

    task_start_time           TIMESTAMPTZ;
    task_due_time             TIMESTAMPTZ;
    task_completed_at         TIMESTAMPTZ;
    task_status_value         TEXT;
    task_category_value       TEXT;
    task_priority_value       TEXT;
    task_progress_value       NUMERIC;

    image_status_value        TEXT;
    image_completed_at        TIMESTAMPTZ;

    entry_start_time          TIMESTAMPTZ;
    entry_end_time            TIMESTAMPTZ;
    entry_minutes             INTEGER;

    ---------------------------------------------------------------------------
    -- ENUM VALUE LISTS
    ---------------------------------------------------------------------------
    project_statuses          TEXT[] := ARRAY['To-Do', 'In Progress', 'On Hold', 'Completed', 'Cancelled', 'Archived'];
    project_priorities        TEXT[] := ARRAY['Low', 'Normal', 'High', 'Urgent'];
    task_statuses             TEXT[] := ARRAY['To-Do', 'Assigned', 'In Progress', 'Paused', 'Completed', 'Cancelled'];
    task_categories           TEXT[] := ARRAY['Import', 'Cull', 'Edit', 'Quality Review', 'Export', 'Delivery', 'Other'];
    task_priorities           TEXT[] := ARRAY['Low', 'Normal', 'High', 'Urgent'];
    image_statuses            TEXT[] := ARRAY['Pending', 'In Progress', 'Completed', 'Rejected'];
    project_types             TEXT[] := ARRAY['Wedding Gallery', 'Product Shoot', 'Real Estate Listing', 'Corporate Headshots', 'Engagement Session', 'Event Coverage', 'Family Portraits', 'Brand Campaign'];
    client_companies          TEXT[] := ARRAY['Ackley Creative Group', 'Northstar Weddings', 'Summit Portrait Studio', 'Blue Ridge Events', 'Golden Hour Media', 'Evergreen Realty', 'Coastal Brand House', 'Redwood Product Co'];
BEGIN
    ---------------------------------------------------------------------------
    -- CLEANUP GENERATED SEED DATA ONLY
    ---------------------------------------------------------------------------
    IF CLEAR_AUTO_SEED_DATA THEN
        DELETE FROM time_entries
        WHERE task_id IN (
            SELECT task_id
            FROM tasks
            WHERE description ILIKE '%' || SEED_TAG || '%'
               OR task_name ILIKE 'Seed Task %'
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
            'MGR-' || lpad(i::TEXT, 3, '0'),
            'Manager' || i,
            'Seed',
            'Manager' || i || ' Seed',
            'Editing Manager',
            'Photometrics',
            'Operations',
            'Remote',
            'Active',
            'seed.manager.' || lpad(i::TEXT, 3, '0') || '@' || SEED_EMAIL_DOMAIN,
            DEFAULT_PASSWORD_HASH,
            'Manager',
            false,
            true,
            SEED_TAG
        )
        ON CONFLICT (email)
        DO UPDATE SET
            employee_id = EXCLUDED.employee_id,
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
            is_admin = EXCLUDED.is_admin,
            is_active = EXCLUDED.is_active,
            notes = EXCLUDED.notes,
            updated_at = now()
        RETURNING user_id INTO user_id_value;

        manager_ids := array_append(manager_ids, user_id_value);
    END LOOP;

    ---------------------------------------------------------------------------
    -- ADDITIONAL EMPLOYEES
    ---------------------------------------------------------------------------
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
            'EMP-' || lpad(i::TEXT, 3, '0'),
            'MGR-' || lpad((1 + ((i - 1) % ADDITIONAL_MANAGER_COUNT))::TEXT, 3, '0'),
            'Employee' || i,
            'Seed',
            'Employee' || i || ' Seed',
            'Photo Editor',
            'Photometrics',
            'Editing',
            'Remote',
            'Active',
            'seed.employee.' || lpad(i::TEXT, 3, '0') || '@' || SEED_EMAIL_DOMAIN,
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
            is_admin = EXCLUDED.is_admin,
            is_active = EXCLUDED.is_active,
            notes = EXCLUDED.notes,
            updated_at = now()
        RETURNING user_id INTO user_id_value;

        employee_ids := array_append(employee_ids, user_id_value);
    END LOOP;

    ---------------------------------------------------------------------------
    -- CLIENTS
    ---------------------------------------------------------------------------
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
            'Client' || i,
            NULL,
            'Seed',
            'Owner',
            client_companies[1 + ((i - 1) % array_length(client_companies, 1))],
            'seed.client.' || lpad(i::TEXT, 3, '0') || '@' || SEED_EMAIL_DOMAIN,
            '555010' || lpad(i::TEXT, 4, '0'),
            'https://client-' || i || '.example.com',
            SEED_TAG || ' Generated client for dashboard testing.',
            (100 + i)::TEXT || ' Main Street',
            NULL,
            'Austin',
            'Texas',
            '78' || lpad(i::TEXT, 3, '0'),
            'USA',
            (200 + i)::TEXT || ' Billing Avenue',
            NULL,
            'Austin',
            'Texas',
            '79' || lpad(i::TEXT, 3, '0'),
            'USA'
        )
        ON CONFLICT (email)
        DO UPDATE SET
            first_name = EXCLUDED.first_name,
            middle_name = EXCLUDED.middle_name,
            last_name = EXCLUDED.last_name,
            title = EXCLUDED.title,
            company_name = EXCLUDED.company_name,
            phone_number = EXCLUDED.phone_number,
            website = EXCLUDED.website,
            notes = EXCLUDED.notes,
            address_line1 = EXCLUDED.address_line1,
            address_line2 = EXCLUDED.address_line2,
            city = EXCLUDED.city,
            state = EXCLUDED.state,
            postal_code = EXCLUDED.postal_code,
            country = EXCLUDED.country,
            billing_address_line1 = EXCLUDED.billing_address_line1,
            billing_address_line2 = EXCLUDED.billing_address_line2,
            billing_city = EXCLUDED.billing_city,
            billing_state = EXCLUDED.billing_state,
            billing_postal_code = EXCLUDED.billing_postal_code,
            billing_country = EXCLUDED.billing_country,
            updated_at = now()
        RETURNING client_id INTO client_id_value;

        client_ids := array_append(client_ids, client_id_value);
    END LOOP;

    ---------------------------------------------------------------------------
    -- PROJECTS, TASKS, IMAGES, TIME ENTRIES
    ---------------------------------------------------------------------------
    FOREACH client_id_value IN ARRAY client_ids LOOP
        FOR i IN 1..PROJECTS_PER_CLIENT LOOP
            project_counter := project_counter + 1;

            project_status_value := project_statuses[1 + ((project_counter - 1) % array_length(project_statuses, 1))];
            project_priority_value := project_priorities[1 + ((project_counter - 1) % array_length(project_priorities, 1))];

            project_start_time := now() - ((project_counter % 45)::TEXT || ' days')::INTERVAL;
            project_shoot_time := project_start_time + interval '2 days';
            project_due_time := project_start_time + interval '21 days';

            IF project_status_value = 'Completed' THEN
                project_completed_at := project_due_time - interval '1 day';
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
                manager_ids[1 + ((project_counter - 1) % array_length(manager_ids, 1))],
                'Seed Project ' || project_counter || ' ' || project_types[1 + ((project_counter - 1) % array_length(project_types, 1))],
                SEED_TAG || ' Generated project for dashboard testing.',
                project_status_value::project_status,
                project_priority_value::project_priority,
                SEED_TAG || ' Configurable seed project.',
                project_start_time,
                project_shoot_time,
                project_due_time,
                project_completed_at
            )
            RETURNING project_id INTO project_id_value;

            project_task_ids := ARRAY[]::UUID[];

            FOR j IN 1..TASKS_PER_PROJECT LOOP
                task_counter := task_counter + 1;

                task_status_value := task_statuses[1 + ((task_counter - 1) % array_length(task_statuses, 1))];
                task_category_value := task_categories[1 + ((task_counter - 1) % array_length(task_categories, 1))];
                task_priority_value := task_priorities[1 + ((task_counter - 1) % array_length(task_priorities, 1))];

                task_start_time := project_start_time + ((j - 1)::TEXT || ' days')::INTERVAL;
                task_due_time := task_start_time + interval '5 days';

                IF task_status_value = 'Completed' THEN
                    task_completed_at := task_due_time - interval '1 day';
                    task_progress_value := 100;
                ELSIF task_status_value IN ('In Progress', 'Paused') THEN
                    task_completed_at := NULL;
                    task_progress_value := 50;
                ELSE
                    task_completed_at := NULL;
                    task_progress_value := 0;
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
                    'Seed Task ' || task_counter || ' ' || task_category_value,
                    task_category_value::task_category,
                    task_priority_value::task_priority,
                    SEED_TAG || ' Generated task for dashboard testing.',
                    task_status_value::task_status,
                    task_progress_value,
                    task_start_time,
                    task_due_time,
                    task_completed_at,
                    manager_ids[1 + ((task_counter - 1) % array_length(manager_ids, 1))],
                    employee_ids[1 + ((task_counter - 1) % array_length(employee_ids, 1))]
                )
                RETURNING task_id INTO task_id_value;

                project_task_ids := array_append(project_task_ids, task_id_value);

                FOR n IN 1..TIME_ENTRIES_PER_TASK LOOP
                    entry_minutes := 30 + (n * 15);
                    entry_start_time := task_start_time + ((n * 2)::TEXT || ' hours')::INTERVAL;
                    entry_end_time := entry_start_time + (entry_minutes::TEXT || ' minutes')::INTERVAL;

                    INSERT INTO time_entries (
                        task_id,
                        employee_id,
                        start_time,
                        end_time,
                        total_time
                    )
                    VALUES (
                        task_id_value,
                        employee_ids[1 + ((task_counter + n - 2) % array_length(employee_ids, 1))],
                        entry_start_time,
                        entry_end_time,
                        round((entry_minutes / 60.0)::NUMERIC, 2)
                    );
                END LOOP;
            END LOOP;

            FOR k IN 1..IMAGES_PER_PROJECT LOOP
                image_counter := image_counter + 1;
                image_status_value := image_statuses[1 + ((image_counter - 1) % array_length(image_statuses, 1))];

                IF image_status_value = 'Completed' THEN
                    image_completed_at := project_start_time + interval '7 days';
                ELSE
                    image_completed_at := NULL;
                END IF;

                INSERT INTO images (
                    project_id,
                    task_id,
                    name,
                    description,
                    url,
                    status,
                    completed_at
                )
                VALUES (
                    project_id_value,
                    project_task_ids[1 + ((k - 1) % array_length(project_task_ids, 1))],
                    'seed_project_' || replace(project_id_value::TEXT, '-', '') || '_image_' || lpad(k::TEXT, 3, '0') || '.jpg',
                    SEED_TAG || ' Generated image for dashboard testing.',
                    'https://example.com/photometrics/' || project_id_value || '/image-' || lpad(k::TEXT, 3, '0') || '.jpg',
                    image_status_value::image_status,
                    image_completed_at
                );
            END LOOP;
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Photometrics seed complete. Managers: %, employees: %, clients: %, projects: %, tasks: %, images: %',
        array_length(manager_ids, 1),
        array_length(employee_ids, 1),
        array_length(client_ids, 1),
        project_counter,
        task_counter,
        image_counter;
END $$;

COMMIT;
