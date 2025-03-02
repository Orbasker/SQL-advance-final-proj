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
    timestamp TIMESTAMP DEFAULT NOW(),
    custom_fields JSON
);

-- function to create user
CREATE OR REPLACE FUNCTION create_user(
    _username TEXT, 
    _password TEXT, 
    _permission TEXT
) RETURNS UUID AS $$
DECLARE 
    _user_id UUID;
    _log_id INT;
BEGIN
    -- Insert new user
    INSERT INTO users (username, password)
    VALUES (_username, crypt(_password, gen_salt('bf')))
    RETURNING id INTO _user_id;

    -- Assign initial permission
    INSERT INTO permissions (user_id, permission_type)
    VALUES (_user_id, _permission);

    -- Log the action with JSON metadata
    INSERT INTO logs (user_id, action, custom_fields)
    VALUES (
        _user_id,
        'User Created',
        json_build_object(
            'action', 'create user',
            'affectedUser', _user_id,
            'username', _username,
            'assignedPermission', _permission,
            'timestamp', NOW()
        )
    ) RETURNING id INTO _log_id;

    -- Return the new user ID
    RETURN _user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- allow user registration from login
GRANT EXECUTE ON FUNCTION create_user(TEXT, TEXT, TEXT) TO public;

--function to change password
CREATE OR REPLACE FUNCTION public.change_password_new(
    _user_id UUID,
    _new_password TEXT,
    _performed_by UUID  -- Accept admin ID
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
    INSERT INTO public.logs (user_id, action, custom_fields)
    VALUES (
        _performed_by, 
        'Changed password of user ' || _user_id,
        json_build_object(
            'action', 'change password',
            'affectedUser', _user_id,
            'performedBy', _performed_by,
            'timestamp', NOW()
        )
    );

    RETURN 'Success: Password updated successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- function to update permissions for user
CREATE OR REPLACE FUNCTION update_permissions_new(
    _user_id UUID, 
    _new_permission TEXT,
    _performed_by UUID  -- Accept admin ID
) RETURNS JSON AS $$
DECLARE
    _log_id INT;
BEGIN
    -- Ensure user exists
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = _user_id) THEN
        RETURN json_build_object('error', 'User not found');
    END IF;

    -- Update or insert permission
    WITH upsert_cte AS (
        UPDATE public.permissions
        SET permission_type = _new_permission, granted_at = NOW()
        WHERE user_id = _user_id
        RETURNING user_id
    )
    INSERT INTO public.permissions (user_id, permission_type, granted_at)
    SELECT _user_id, _new_permission, NOW()
    WHERE NOT EXISTS (SELECT 1 FROM upsert_cte);

    -- Log the action
    INSERT INTO public.logs (user_id, action, custom_fields)
    VALUES (
        _performed_by,
        'Changed permissions of user ' || _user_id || ' to ' || _new_permission,
        json_build_object(
            'action', 'update permissions',
            'affectedUser', _user_id,
            'newPermission', _new_permission,
            'performedBy', _performed_by,
            'timestamp', NOW()
        )
    ) RETURNING id INTO _log_id;

    -- Return success message as JSON
    RETURN json_build_object('success', 'Permission updated successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- function to delete user
CREATE OR REPLACE FUNCTION delete_user_new(
    _user_id UUID,
    _performed_by UUID  -- Accept admin ID
) RETURNS JSON AS $$
DECLARE
    _exists BOOLEAN;
    _log_id INT;
BEGIN
    -- Check if user exists
    SELECT EXISTS (SELECT 1 FROM users WHERE id = _user_id) INTO _exists;
    IF NOT _exists THEN
        RETURN json_build_object('error', 'User not found');
    END IF;

     -- Log the action
    INSERT INTO public.logs (user_id, action, custom_fields)
    VALUES (
        _performed_by,
        'Deleted user ' || _user_id,
        json_build_object(
            'action', 'delete user',
            'affectedUser', _user_id,
            'performedBy', _performed_by,
            'timestamp', NOW()
        )
    ) RETURNING id INTO _log_id;

    -- Delete related permissions
    DELETE FROM permissions WHERE user_id = _user_id;

    -- Delete the user (logs will retain NULL references)
    DELETE FROM users WHERE id = _user_id;


    -- Return success message
    RETURN json_build_object('success', 'User deleted successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
