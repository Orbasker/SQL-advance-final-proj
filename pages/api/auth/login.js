import { supabase } from "@/lib/supabaseClient";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required." });
    }

    // Fetch user from database
    const { data, error } = await supabase
        .from("users")
        .select("id, username, password")
        .eq("username", username)
        .single();

    if (error || !data) {
        return res.status(400).json({ error: "Invalid username or password." });
    }

    // Verify password using Supabase's built-in crypt function
    const { data: validPassword, error: hashError } = await supabase
        .rpc("check_password", { input_password: password, stored_password: data.password });

    if (hashError || !validPassword) {
        return res.status(400).json({ error: "Invalid username or password." });
    }

    return res.status(200).json({ message: "Login successful!", userId: data.id });
}
