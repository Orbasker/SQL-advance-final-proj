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
    const router = useRouter();
    const [newPassword, setNewPassword] = useState("");
    const [newPermission, setNewPermission] = useState("");

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
        setNewPassword(""); // Reset password state
        setNewPermission(""); // Reset permission state
    };

    return (
        <div className="p-8 bg-gray-100 min-h-screen">
            <div className="flex flex-col justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">User Management</h1>
                <br></br>
                <button onClick={() => setShowForm(true)} className="bg-green-500 text-white px-4 py-2 rounded shadow">
                    + Create User
                </button>
                <br></br>
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
                    {modalType === 'deleteUser' && (
                        <p>Are you sure you want to delete this user?</p>
                    )}
                </Modal>
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
                        {users.map((user, index) => (
                            <tr 
                                key={user.user_id} 
                                className={`${index % 2 === 0 ? "bg-gray-100" : "bg-white"} hover:bg-gray-200 transition`}
                            >
                                <td className="p-3 border-b">{user.user_id}</td>
                                <td className="p-3 border-b">{user.username}</td>
                                <td className="p-3 border-b capitalize">{user.permission_type}</td>
                                <td className="p-3 border-b flex flex-wrap justify-center gap-2">
                                    <button 
                                        onClick={() => handleChangePassword(user.user_id)} 
                                        className="bg-yellow-500 text-white px-3 py-1 rounded shadow-md hover:bg-yellow-600 transition"
                                    >
                                        Change Password
                                    </button>
                                    <button 
                                        onClick={() => handleChangePermission(user.user_id)} 
                                        className="bg-purple-500 text-white px-3 py-1 rounded shadow-md hover:bg-purple-600 transition"
                                    >
                                        Change Permission
                                    </button>
                                    <button
                                        onClick={() => handleDeleteUser(user.user_id)}
                                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                                    >
                                        Delete User
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
