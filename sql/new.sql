CREATE OR REPLACE FUNCTION update_permissions_new(
    _user_id UUID, 
    _new_permission TEXT
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
    VALUES (_user_id, 'Permissions updated to ' || _new_permission);

    -- Return success message as JSON
    RETURN json_build_object('success', 'Permission updated successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;