-- TEST the fill script for missing JSON logs
SELECT id, custom_fields, 
       json_build_object(
           'user_id', COALESCE(user_id::TEXT, 'null'),
           'action', COALESCE(action, 'no_data'),
           'timestamp', COALESCE(timestamp::TEXT, 'null')
       ) AS new_custom_fields
FROM logs
WHERE custom_fields IS NULL OR custom_fields::TEXT = '{}';

-- fill script for missing JSON logs
UPDATE logs
SET custom_fields = json_build_object(
    'user_id', COALESCE(user_id::TEXT, 'null'),
    'action', COALESCE(action, 'no_data'),
    'timestamp', COALESCE(timestamp::TEXT, 'null')
)
WHERE custom_fields IS NULL OR custom_fields::TEXT = '{}';