import { useEffect, useState } from "react";
import { supabase, changeUserPassword, changeUserPermission } from "@/lib/supabaseClient";
import { useRouter } from "next/router";

export default function Dashboard() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ username: "", password: "", permission: "read_only" });
    const [error, setError] = useState(null);
    const router = useRouter();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);

        const { data, error } = await supabase
            .from('user_permissions')
            .select('user_id, username, permission_type');

        if (error) {
            console.error("🚨 Fetch Users Error:", error);
        } else {
            setUsers(data);
        }

        setLoading(false);
    };



    const handleCreateUser = async (e) => {
        e.preventDefault();
        setError(null);

        if (!formData.username || !formData.password) {
            setError("All fields are required!");
            return;
        }

        const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        });

        const result = await response.json();
        if (!response.ok) {
            setError(result.error?.message || "Failed to create user.");
            return;
        }

        setShowForm(false);
        setFormData({ username: "", password: "", permission: "read_only" });
        fetchUsers();
    };

    const handleChangePassword = async (userId) => {
        const newPassword = prompt("Enter new password:");
        if (!newPassword) return;

        console.log("📡 DEBUG: Calling `changeUserPassword` with:", { userId, newPassword });

        const result = await changeUserPassword(newPassword, userId);

        if (result.error) {
            alert("🚨 Error: " + result.error);
        } else {
            alert("✅ Password changed successfully!");
        }
    };


    const handleChangePermission = async (userId) => {
        const newPermission = prompt("Enter new permission (admin or read_only):");
        if (!newPermission) return;

        const result = await changeUserPermission(userId, newPermission);
        if (result.error) alert("Error: " + result.error);
        else {
            alert("Permission updated successfully!");
            fetchUsers();
        }
    };

    return (
        <div className="p-8 bg-gray-100 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">User Management</h1>
                <button onClick={() => setShowForm(true)} className="bg-green-500 text-white px-4 py-2 rounded shadow">
                    + Create User
                </button>
                <button onClick={() => { localStorage.removeItem("user"); router.push("/login"); }} className="bg-red-500 text-white px-4 py-2 rounded">
                    Logout
                </button>
            </div>

            {showForm && (
                <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg mx-auto">
                    <h2 className="text-xl font-bold mb-4">Create User</h2>
                    {error && <p className="text-red-500">{error}</p>}
                    <form onSubmit={handleCreateUser} className="space-y-4">
                        <input
                            type="text"
                            placeholder="Username"
                            className="w-full p-2 border rounded"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            className="w-full p-2 border rounded"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                        <select
                            className="w-full p-2 border rounded"
                            value={formData.permission}
                            onChange={(e) => setFormData({ ...formData, permission: e.target.value })}
                        >
                            <option value="read_only">Read Only</option>
                            <option value="admin">Admin</option>
                        </select>
                        <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
                            Create User
                        </button>
                    </form>
                </div>
            )}

            {loading ? <p>Loading users...</p> : (
                <table className="w-full bg-white shadow-lg rounded-lg border-collapse">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="p-2 border">ID</th>
                            <th className="p-2 border">Username</th>
                            <th className="p-2 border">Permission</th>
                            <th className="p-2 border">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            console.log(user),
                            <tr key={user.user_id} className="border-b">
                                <td className="p-2">{user.user_id}</td>
                                <td className="p-2">{user.username}</td>
                                <td className="p-2">{user.permission}</td>
                                <td className="p-2">
                                    <button onClick={() => handleChangePassword(user.user_id)} className="bg-yellow-500 text-white px-2 py-1 rounded mr-2">
                                        Change Password
                                    </button>
                                    <button onClick={() => handleChangePermission(user.user_id)} className="bg-purple-500 text-white px-2 py-1 rounded">
                                        Change Permission
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
