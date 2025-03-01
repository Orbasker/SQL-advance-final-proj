import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to change password
export async function changeUserPassword(newPassword, userId, adminId) {
    if (!newPassword || !userId || !adminId) {
        console.error("🚨 ERROR: Missing parameters!", { newPassword, userId, adminId });
        return { error: "Missing password, user ID, or admin ID." };
    }

    const payload = {
        _new_password: newPassword,  
        _user_id: userId,  
        _performed_by: adminId,  // ✅ Logs who performed this action
    };

    console.log("📡 FIXED: Sending API Request →", JSON.stringify(payload));

    const { data, error } = await supabase.rpc("change_password_new", payload);

    if (error) {
        console.error("🚨 Supabase API Error:", error);
        return { error: error.message };
    }

    console.log("✅ Password changed successfully!", data);
    return { success: data };
}

// Function to change user permission
export async function changeUserPermission(userId, newPermission, adminId) {
    if (!userId || !adminId) {
        console.error("🚨 ERROR: Missing parameters!", { userId, newPermission, adminId });
        return { error: "Missing user ID, or admin ID." };
    }
    if (!newPermission){
        return { error: "Missing permission: " || newPermission };
    }

    const payload = {
        _user_id: userId,  
        _new_permission: newPermission,
        _performed_by: adminId,  // ✅ Logs who performed this action
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
export async function deleteUser(userId, adminId) {
    if (!userId || !adminId) {
        console.error("🚨 ERROR: Missing parameters!", { userId, adminId });
        return { error: "User ID and admin ID are required." };
    }

    console.log("📡 Deleting user:", userId);

    // Call the SQL function via Supabase RPC
    const { data, error } = await supabase.rpc("delete_user_new", {
        _user_id: userId,
        _performed_by: adminId,  // ✅ Logs who performed this action
    });

    if (error) {
        console.error("🚨 Error deleting user:", error);
        return { error: error.message };
    }

    if (data.error) {
        console.error("🚨 SQL Error:", data.error);
        return { error: data.error };
    }

    console.log("✅", data.success);
    return { success: data.success };
}

// Function to create a new user (in dashboard)
