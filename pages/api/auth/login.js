import { supabase } from "@/lib/supabaseClient";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required." });
    }

    // ✅ Fetch user from `users` table
    const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, username, password")
        .eq("username", username)
        .single();

    if (userError || !userData) {
        return res.status(400).json({ error: "Invalid username or password." });
    }

    // ✅ Verify password
    const { data: validPassword, error: hashError } = await supabase
        .rpc("check_password", { input_password: password, stored_password: userData.password });

    if (hashError || !validPassword) {
        return res.status(400).json({ error: "Invalid username or password." });
    }

    // ✅ Fetch user's permission
    const { data: permissionData, error: permissionError } = await supabase
        .from("user_permissions")
        .select("permission_type")
        .eq("username", username)
        .single();

    if (permissionError || !permissionData) {
        return res.status(400).json({ error: "Failed to retrieve user permissions." });
    }

    // ✅ Return user data with permission
    const userResponse = {
        message: "Login successful!",
        userId: userData.id,
        username: userData.username,
        permission: permissionData.permission_type, // ✅ Now permission is included
    };

    return res.status(200).json(userResponse);
}
