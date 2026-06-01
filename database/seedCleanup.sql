BEGIN;

DELETE FROM tasks
WHERE task_id IN (
                  '00000000-0000-4000-8000-000000000301',
                  '00000000-0000-4000-8000-000000000302',
                  '00000000-0000-4000-8000-000000000303',
                  '00000000-0000-4000-8000-000000000304'
    )
   OR project_id IN (
                     '10000000-0000-4000-8000-000000000101',
                     '10000000-0000-4000-8000-000000000102'
    )
   OR task_name IN (
                    'Import wedding gallery',
                    'Cull wedding gallery',
                    'Quality review wedding gallery',
                    'Edit listing images'
    );

DELETE FROM projects
WHERE project_id IN (
                     '10000000-0000-4000-8000-000000000101',
                     '10000000-0000-4000-8000-000000000102'
    )
   OR project_name IN (
                       'Wedding Album Editing',
                       'Product Photography Retouching'
    );

DELETE FROM clients
WHERE client_id IN (
                    '00000000-0000-4000-8000-000000000101',
                    '00000000-0000-4000-8000-000000000102'
    )
   OR email IN (
                'alex.rivera@example.com',
                'taylor.morgan@example.com'
    );

DELETE FROM users
WHERE user_id IN (
                  '00000000-0000-4000-8000-000000000001',
                  '00000000-0000-4000-8000-000000000002',
                  '00000000-0000-4000-8000-000000000003'
    )
   OR email IN (
                'r.williams@gmail.com',
                'b.sagget@gmail.com',
                'jordan.editor@gmail.com'
    );

COMMIT;