import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to change password
export async function changeUserPassword(newPassword, userId) {
    if (!newPassword || !userId) {
        console.error("🚨 ERROR: Missing parameters!", { newPassword, userId });
        return { error: "Missing password or user ID." };
    }

    const payload = {
        _new_password: newPassword,  // ✅ Ensure it's included
        _user_id: userId,  // ✅ Ensure it's included
    };

    console.log("📡 FIXED: Sending API Request →", JSON.stringify(payload));

    const { data, error } = await supabase.rpc("change_password", payload);

    if (error) {
        console.error("🚨 Supabase API Error:", error);
        return { error: error.message };
    }

    console.log("✅ Password changed successfully!", data);
    return { success: data };
}

// Function to change user permission
export async function changeUserPermission(userId, newPermission) {
    if (!userId || !newPermission) {
        console.error("🚨 ERROR: Missing parameters!", { userId, newPermission });
        return { error: "Missing user ID or permission." };
    }

    const payload = {
        _user_id: userId,  // ✅ Now using userId instead of username
        _new_permission: newPermission,
    };

    console.log("📡 Sending API Request →", JSON.stringify(payload));

    const { data, error } = await supabase.rpc("update_permissions_new", payload);

    if (error) {
        console.error("🚨 Supabase API Error:", error);
        return { error: error.message };
    }

    if (data.error) {
        console.error("🚨 SQL Error:", data.error);
        return { error: data.error };
    }

    console.log("✅ Permission updated successfully!", data.success);
    return { success: data.success };
}

// Function to delete a user
export async function deleteUser(userId) {
    if (!userId) {
        console.error("🚨 ERROR: Missing user ID!");
        return { error: "User ID is required." };
    }

    console.log("📡 Deleting user:", userId);

    // 🔹 Step 1: Delete from permissions table (if applicable)
    const { error: permissionError } = await supabase
        .from('permissions')  // Replace with the actual permissions table name
        .delete()
        .eq('user_id', userId);

    if (permissionError) {
        console.error("🚨 Error deleting from permissions:", permissionError);
        return { error: permissionError.message };
    }

    // 🔹 Step 2: Delete from users table
    const { error: userError } = await supabase
        .from('users')  // Replace with the actual users table name
        .delete()
        .eq('id', userId);  // Adjust if needed

    if (userError) {
        console.error("🚨 Error deleting from users:", userError);
        return { error: userError.message };
    }

    // 🔹 Step 3 (Optional): Delete from Supabase Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    if (authError) {
        console.error("🚨 Error deleting from Supabase Auth:", authError);
        return { error: authError.message };
    }

    console.log("✅ User deleted successfully!");
    return { success: true };
}