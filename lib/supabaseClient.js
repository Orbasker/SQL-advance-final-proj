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
export async function changeUserPermission(username, newPermission) {
    const { data, error } = await supabase.rpc("update_permissions", {
        _username: username,
        _new_permission: newPermission,
    });

    if (error) {
        console.error("🚨 Error changing permission:", error);
        return { error: error.message };
    }

    console.log("✅", data);
    return { success: data };
}
