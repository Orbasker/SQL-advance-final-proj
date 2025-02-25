// pages/api/auth/register.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Supabase URL or Service Role Key is missing. Check your environment variables.");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { username, password, permission } = req.body;

    if (!username || !password || !permission) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    const { data, error } = await supabaseAdmin.rpc('create_user', {
        _username: username,
        _password: password,
        _permission: permission,
    });

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ message: 'User created successfully!', userId: data });
}
