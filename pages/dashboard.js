import { useEffect, useState } from "react";
import { supabase, changeUserPassword, changeUserPermission, deleteUser } from "@/lib/supabaseClient";
import { useRouter } from "next/router";
import Modal from '../components/modal'; // Adjust the path as necessary
import '@/app/globals.css';

export default function Dashboard() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ username: "", password: "", permission: "read_only" });
    const [error, setError] = useState(null);
    const [modalType, setModalType] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [session, setSession] = useState(null); // ✅ Store logged-in user session
    const router = useRouter();
    const [newPassword, setNewPassword] = useState("");
    const [newPermission, setNewPermission] = useState("");

    useEffect(() => {
        const storedUser = localStorage.getItem("user");

        if (!storedUser) {
            console.error("🚨 No user found in localStorage. Redirecting...");
            router.replace("/login");
            return;
        }

        try {
            const parsedSession = JSON.parse(storedUser);
            if (!parsedSession.permission) {
                console.error("🚨 Permission is undefined. Redirecting...");
                router.replace("/login");
                return;
            }

            setSession(parsedSession); // ✅ Store session state

            if (parsedSession.permission === "admin") {
                fetchUsers(); // Admin fetches all users
            } else {
                fetchUserData(parsedSession.username); // Read-only user fetches own data
            }
        } catch (error) {
            console.error("🚨 Error parsing user data:", error);
            localStorage.removeItem("user");
            router.replace("/login");
        }
    }, []);

    const fetchUserData = async (username) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("user_permissions")
                .select("user_id, username, permission_type")
                .eq('username', username) // Fetch only logged-in user
                .single();
            
            if (error) throw error;

            setUsers([data]); // Store user data
        } catch (error) {
            console.error("🚨 Fetch User Data Error:", error.message || error);
        } finally {
            setLoading(false);
        }
    };

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

    const handleChangePassword = (userId) => {
        setSelectedUser(userId);
        setModalType('changePassword');
    };
    
    const handleChangePermission = (userId) => {
        setSelectedUser(userId);
        setModalType('changePermission');
    };
    
    const handleDeleteUser = (userId) => {
        setSelectedUser(userId);
        setModalType('deleteUser');
    };

    const handleModalConfirm = async () => {
        if (modalType === 'changePassword') {
            const result = await changeUserPassword(newPassword, selectedUser);
            if (result.error) {
                alert("🚨 Error: " + result.error);
            } else {
                alert("✅ Password changed successfully!");
                fetchUsers();
            }
        } else if (modalType === 'changePermission') {
            const result = await changeUserPermission(selectedUser, newPermission);
            if (result.error) {
                alert("Error: " + result.error);
            } else {
                alert("Permission updated successfully!");
                fetchUsers();
            }
        } else if (modalType === 'deleteUser') {
            const result = await deleteUser(selectedUser);
            if (result.error) {
                alert("🚨 Error: " + result.error);
            } else {
                alert("✅ User deleted successfully!");
                fetchUsers();
            }
        }
        setModalType(null);
        setSelectedUser(null);
        setNewPassword("");
        setNewPermission("");
    };

    return (
        <div className="p-8 bg-gray-100 min-h-screen">
            <div className="flex flex-col justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">User Management</h1>
                <br />
                {session?.permission === "admin" && (
                    <button onClick={() => setShowForm(true)} className="bg-green-500 text-white px-4 py-2 rounded shadow">
                        + Create User
                    </button>
                )}
                <br />
                <button onClick={() => { localStorage.removeItem("user"); router.push("/login"); }} className="bg-red-500 text-white px-4 py-2 rounded">
                    Logout
                </button>
                <Modal
                    isOpen={modalType !== null}
                    onClose={() => {
                        setModalType(null);
                        setNewPassword("");
                        setNewPermission("");
                        setSelectedUser(null);
                    }}
                    title={modalType === 'changePassword' ? "Change Password" : modalType === 'changePermission' ? "Change Permission" : "Delete User"}
                    onConfirm={handleModalConfirm}
                >
                    {modalType === 'changePassword' && (
                        <div>
                            <input
                                type="password"
                                placeholder="New Password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full p-2 border rounded mb-2"
                            />
                            <p>Are you sure you want to change the password?</p>
                        </div>
                    )}
                    {modalType === 'changePermission' && (
                        <div>
                            <select
                                value={newPermission}
                                onChange={(e) => setNewPermission(e.target.value)}
                                className="w-full p-2 border rounded mb-2"
                            >
                                <option value="read_only">Read Only</option>
                                <option value="admin">Admin</option>
                            </select>
                            <p>Are you sure you want to change the permission?</p>
                        </div>
                    )}
                    {modalType === 'deleteUser' && <p>Are you sure you want to delete this user?</p>}
                </Modal>
            </div>

            {loading ? <p>Loading users...</p> : (
                <table className="w-full bg-white shadow-lg rounded-lg border border-gray-300 overflow-hidden">
                    <thead className="bg-blue-600 text-white">
                        <tr>
                            <th className="p-3 text-left">ID</th>
                            <th className="p-3 text-left">Username</th>
                            <th className="p-3 text-left">Permission</th>
                            <th className="p-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((userItem) => (
                            <tr key={userItem.user_id} className="hover:bg-gray-200 transition">
                                <td className="p-3 border-b">{userItem.user_id}</td>
                                <td className="p-3 border-b">{userItem.username}</td>
                                <td className="p-3 border-b capitalize">{userItem.permission_type}</td>
                                <td className="p-3 border-b flex flex-wrap justify-center gap-2">
                                    <button onClick={() => handleChangePassword(userItem.user_id)} className="bg-yellow-500 text-white px-3 py-1 rounded shadow-md hover:bg-yellow-600 transition">
                                        Change Password
                                    </button>
                                    {session.permission === "admin" && (
                                        <button onClick={() => handleChangePermission(userItem.user_id)} className="bg-purple-500 text-white px-3 py-1 rounded shadow-md hover:bg-purple-600 transition">
                                            Change Permission
                                        </button>
                                    )}
                                    {(session.permission === "admin" || session.userId === userItem.user_id) && (
                                        <button onClick={() => handleDeleteUser(userItem.user_id)} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
                                            Delete User
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
