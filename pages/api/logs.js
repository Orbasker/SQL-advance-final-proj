import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { userId, role } = req.query;

    if (!userId || !role) {
        return res.status(400).json({ error: 'Missing userId or role' });
    }

    let query = supabase
        .from('logs')
        .select('id, user_id, action, timestamp, custom_fields') // Include custom_fields
        .order('timestamp', { ascending: false });

    if (role === 'read_only') {
        query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    return res.status(200).json(data);
}
