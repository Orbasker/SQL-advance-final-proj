import { testSupabaseConnection } from "@/lib/supabaseClient";

export default async function handler(req, res) {
    const result = await testSupabaseConnection();

    if (!result.success) {
        return res.status(500).json({
            message: "Supabase connection failed.",
            error: result.error
        });
    }

    return res.status(200).json({
        message: "Supabase connected successfully!",
        data: result.data
    });
}
