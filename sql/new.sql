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
    INSERT INTO public.logs (user_id, action)
    VALUES (_performed_by, 'Changed password of user ' || _user_id);

    RETURN 'Success: Password updated successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_permissions_new(
    _user_id UUID, 
    _new_permission TEXT,
    _performed_by UUID  -- Accept admin ID
) RETURNS JSON AS $$
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
    INSERT INTO public.permissions (user_id, permission_type)
    SELECT _user_id, _new_permission
    WHERE NOT EXISTS (SELECT 1 FROM upsert_cte);

    -- Log the action
    INSERT INTO public.logs (user_id, action)
    VALUES (_performed_by, 'Changed permissions of user ' || _user_id || ' to ' || _new_permission);

    -- Return success message as JSON
    RETURN json_build_object('success', 'Permission updated successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION delete_user_new(
    _user_id UUID,
    _performed_by UUID  -- Accept admin ID
) RETURNS JSON AS $$
DECLARE
    _exists BOOLEAN;
BEGIN
    -- Check if user exists
    SELECT EXISTS (SELECT 1 FROM users WHERE id = _user_id) INTO _exists;
    IF NOT _exists THEN
        RETURN json_build_object('error', 'User not found');
    END IF;

    -- Delete related permissions
    DELETE FROM permissions WHERE user_id = _user_id;

    -- Delete the user (logs will retain NULL references)
    DELETE FROM users WHERE id = _user_id;

    -- Log the action
    INSERT INTO public.logs (user_id, action)
    VALUES (_performed_by, 'Deleted user ' || _user_id);

    -- Return success message
    RETURN json_build_object('success', 'User deleted successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;