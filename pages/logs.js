import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';
import Navbar from "@/components/Navbar";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const LogsPage = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const storedUser = localStorage.getItem("user");

        if (!storedUser) {
            console.warn("🚨 No stored session found. Redirecting to login.");
            router.replace("/login");
            return;
        }

        try {
            const parsedSession = JSON.parse(storedUser);
            console.log("✅ Retrieved session:", parsedSession);
            setUser(parsedSession);
        } catch (error) {
            console.error("🚨 Error parsing session data:", error);
            localStorage.removeItem("user");
            router.replace("/login");
        }
    }, []);

    useEffect(() => {
        if (!user) {
            console.warn("User not set yet, waiting...");
            return;
        }

        const fetchLogs = async () => {
            console.log("Fetching logs for user:", user.userId);

            setLoading(true);

            // Fetch user role from user_permissions instead of users
            const { data: userData, error: userError } = await supabase
                .from('user_permissions') // ✅ Correct table
                .select('permission_type') // ✅ Fetch role correctly
                .eq('user_id', user.userId) // ✅ Use correct user ID field
                .single();

            if (userError) {
                console.error("🚨 Error fetching user role:", userError.message);
                setLoading(false);
                return;
            }

            console.log("✅ User role fetched:", userData);

            try {
                const response = await fetch(`/api/logs?userId=${user.userId}&role=${userData.permission_type}`);
                const logsData = await response.json();

                if (!response.ok) {
                    console.error("🚨 Error fetching logs from API:", logsData);
                    setLoading(false);
                    return;
                }

                console.log("✅ Logs fetched:", logsData);
                setLogs(logsData);
            } catch (fetchError) {
                console.error("🚨 Network error while fetching logs:", fetchError);
            }

            setLoading(false);
        };

        fetchLogs();
    }, [user]);


    if (loading) {
        console.log("Loading state active...");
        return <p>Loading logs...</p>;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Logs</h1>
            <Navbar session={user} />
            <table className="table-auto w-full border-collapse border border-gray-200">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border p-2">Action</th>
                        <th className="border p-2">Timestamp</th>
                        <th className="border p-2">Custom Fields</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.length === 0 ? (
                        <tr>
                            <td colSpan="3" className="border p-2 text-center">No logs found</td>
                        </tr>
                    ) : (
                        logs.map((log) => (
                            <tr key={log.id}>
                                <td className="border p-2">{log.action}</td>
                                <td className="border p-2">{new Date(log.timestamp).toLocaleString()}</td>
                                <td className="border p-2">
                                    {log.custom_fields ? (
                                        <pre className="bg-gray-100 p-2 rounded text-xs">
                                            {JSON.stringify(log.custom_fields, null, 2)}
                                        </pre>
                                    ) : 'No details'}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default LogsPage;
