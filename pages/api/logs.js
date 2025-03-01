import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { userId } = req.query;
    if (!userId) {
        return res.status(400).json({ error: 'Missing userId' });
    }

    console.log(`✅ Fetching user role for userId: ${userId}`);

    // Fetch user role from user_permissions
    const { data: userData, error: userError } = await supabase
        .from('user_permissions') // ✅ Correct table
        .select('permission_type') // ✅ Fetch correct column
        .eq('user_id', userId) // ✅ Ensure correct field
        .single();

    if (userError) {
        console.error("🚨 Error fetching user role:", userError.message);
        return res.status(500).json({ error: userError.message });
    }

    const role = userData.permission_type;
    console.log(`✅ User role is: ${role}`);

    // Fetch logs based on user role
    let query = supabase
        .from('logs')
        .select('id, user_id, action, timestamp')
        .order('timestamp', { ascending: false });

    if (role === 'read_only') {
        query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
        console.error("🚨 Error fetching logs:", error.message);
        return res.status(500).json({ error: error.message });
    }

    console.log("✅ Logs successfully retrieved:", data.length, "entries found.");
    return res.status(200).json(data);
}
