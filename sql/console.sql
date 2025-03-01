-- Users Table
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Permissions Table
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    permission_type TEXT CHECK (permission_type IN ('read_only', 'admin')) NOT NULL,
    granted_at TIMESTAMP DEFAULT NOW()
);

-- Logs Table
CREATE TABLE logs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW()
);



CREATE OR REPLACE FUNCTION create_user(_username TEXT, _password TEXT, _permission TEXT)
RETURNS UUID AS $$
DECLARE _user_id UUID;
BEGIN
    INSERT INTO users (username, password)
    VALUES (_username, crypt(_password, gen_salt('bf')))
    RETURNING id INTO _user_id;

    INSERT INTO permissions (user_id, permission_type)
    VALUES (_user_id, _permission);

    INSERT INTO logs (user_id, action)
    VALUES (_user_id, 'User Created');

    RETURN _user_id;
END;
$$ LANGUAGE plpgsql;


DROP FUNCTION IF EXISTS public.change_password;

CREATE OR REPLACE FUNCTION public.change_password(
    _user_id UUID,
    _new_password TEXT
) RETURNS TEXT AS $$
BEGIN
    -- Ensure user exists
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = _user_id) THEN
        RETURN 'Error: User not found';
    END IF;

    -- Update password with bcrypt hashing
    UPDATE public.users
    SET password = crypt(_new_password, gen_salt('bf'))
    WHERE id = _user_id;

    -- Log the password change
    INSERT INTO public.logs (user_id, action)
    VALUES (_user_id, 'Password Changed');

    RETURN 'Success: Password updated successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


SELECT routine_name, data_type
FROM information_schema.routines
WHERE routine_name = 'change_password';

SELECT proname, proargnames, prorettype
FROM pg_proc
JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
WHERE proname = 'change_password';


ALTER FUNCTION public.change_password(UUID, TEXT) SET search_path = public;








DROP function update_permissions(_username TEXT, _new_permission TEXT);
CREATE OR REPLACE FUNCTION update_permissions(_username TEXT, _new_permission TEXT)
RETURNS TEXT AS $$
DECLARE
    _user_id UUID;
    _existing_permission TEXT;
BEGIN
    -- Get user ID based on username
    SELECT id INTO _user_id FROM users WHERE username = _username;

    -- If user doesn't exist, return an error
    IF _user_id IS NULL THEN
        RETURN 'Error: User not found';
    END IF;

    -- Check if the user already has a permission entry
    SELECT permission_type INTO _existing_permission FROM permissions WHERE user_id = _user_id;

    -- If the user has an existing permission, update it
    IF _existing_permission IS NOT NULL THEN
        UPDATE permissions
        SET permission_type = _new_permission
        WHERE user_id = _user_id;
    ELSE
        -- If no permission exists, insert a new entry
        INSERT INTO permissions (user_id, permission_type)
        VALUES (_user_id, _new_permission);
    END IF;

    -- Log the action
    INSERT INTO logs (user_id, action)
    VALUES (_user_id, 'Permissions Updated to ' || _new_permission);

    RETURN 'Success: Permission updated successfully';
END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION get_user_permissions(_username TEXT)
RETURNS TABLE(permission_type TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT permission_type FROM permissions
    WHERE user_id = (SELECT id FROM users WHERE username = _username);
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION check_password(input_password TEXT, stored_password TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN stored_password = crypt(input_password, stored_password);
END;
$$ LANGUAGE plpgsql;



DROP FUNCTION IF EXISTS public.change_password;

CREATE OR REPLACE FUNCTION public.change_password(
    _new_password TEXT,  -- ✅ Switched order
    _user_id UUID       -- ✅ Now second
) RETURNS TEXT AS $$
BEGIN
    -- Ensure user exists
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = _user_id) THEN
        RETURN 'Error: User not found';
    END IF;

    -- Update password securely using bcrypt hashing
    UPDATE public.users
    SET password = crypt(_new_password, gen_salt('bf'))
    WHERE id = _user_id;

    -- Log the password change
    INSERT INTO public.logs (user_id, action)
    VALUES (_user_id, 'Password Changed');

    RETURN 'Success: Password updated successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION public.change_password(TEXT, UUID) SET search_path = public;
ALTER FUNCTION public.change_password(TEXT, UUID) SET search_path = public, pgcrypto;

select pg_sleep(1);


SELECT
    p.proname AS function_name,
    n.nspname AS schema_name,
    pg_catalog.pg_get_function_result(p.oid) AS return_type,
    pg_catalog.pg_get_function_arguments(p.oid) AS arguments
FROM pg_catalog.pg_proc p
JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname = 'change_password';
SHOW search_path;

SET search_path = public, pgcrypto;
ALTER FUNCTION public.change_password(TEXT, UUID) SET search_path = public, pgcrypto;

ALTER FUNCTION public.change_password(TEXT, UUID) SET search_path = public;
GRANT EXECUTE ON FUNCTION public.change_password(TEXT, UUID) TO anon, authenticated, service_role;

ALTER FUNCTION public.change_password(TEXT, UUID) SET search_path = public;
GRANT EXECUTE ON FUNCTION public.change_password(TEXT, UUID) TO anon, authenticated, service_role;
NOTIFY pgrst, 'reload schema';
SELECT pg_sleep(1);
CREATE EXTENSION IF NOT EXISTS pgcrypto;
SELECT * FROM pg_extension WHERE extname = 'pgcrypto';

SELECT change_password('newPassword123', '9f54e923-4daa-4177-8ffc-1669db0c8a56');
