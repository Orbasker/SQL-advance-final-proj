"use client"; // Ensures this is a client component

import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function Navbar() {
    const router = useRouter();
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ username: "", password: "", permission: "read_only" });
    const [error, setError] = useState(null);
    const [session, setSession] = useState(null);

    // Fetch user session from localStorage on client-side
    useEffect(() => {
        if (typeof window !== "undefined") {
            const storedUser = localStorage.getItem("user");
            setSession(storedUser ? JSON.parse(storedUser) : null);
        }
    }, []);

    // Handle logout
    const handleLogout = () => {
        if (typeof window !== "undefined") {
            localStorage.removeItem("user"); // Remove user from storage
        }
        router.push("/login"); // Redirect to login
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setError(null);

        if (!session) {
            console.error("🚨 No user found in localStorage.");
            return;
        }

        const currentUserId = session?.userId;

        if (!formData.username || !formData.password || !currentUserId) {
            setError("All fields and admin ID are required!");
            return;
        }

        const payload = {
            username: formData.username,
            password: formData.password,
            permission: formData.permission || "read_only",
            performed_by: currentUserId, // ✅ Logs who created the user
        };

        const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const result = await response.json();
        if (!response.ok) {
            setError(result.error?.message || "Failed to create user.");
            return;
        }

        setShowForm(false);
        setFormData({ username: "", password: "", permission: "read_only" });
        alert("✅ User created successfully!");
    };

    return (
        <nav className="bg-blue-600 text-white p-4 flex justify-between items-center">
            <h1 className="text-xl font-bold cursor-pointer" onClick={() => router.push("/")}>Dashboard</h1>

            <div className="flex gap-4">
                {session?.permission === "admin" && (
                    <button onClick={() => setShowForm(true)} className="bg-green-500 text-white px-4 py-2 rounded shadow">
                        + Create User
                    </button>
                )}

                <button
                    onClick={() => router.push("/dashboard")}
                    className="bg-gray-200 text-blue-600 px-4 py-2 rounded shadow hover:bg-gray-300 transition"
                >
                    Dashboard
                </button>
                <button
                    onClick={() => router.push("/logs")}
                    className="bg-gray-200 text-blue-600 px-4 py-2 rounded shadow hover:bg-gray-300 transition"
                >
                    View Logs
                </button>
                <button
                    onClick={handleLogout}
                    className="bg-red-500 text-white px-4 py-2 rounded shadow hover:bg-red-600 transition"
                >
                    Logout
                </button>
            </div>

            {showForm && (
                <div className="absolute top-16 right-4 bg-white p-4 rounded-lg shadow-lg">
                    <form onSubmit={handleCreateUser}>
                        <div className="mb-4">
                            <label htmlFor="username" className="block text-sm font-semibold text-gray-700">Username</label>
                            <input
                                type="text"
                                id="username"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                required
                                className="w-full p-2 border rounded text-black"
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="password" className="block text-sm font-semibold text-gray-700">Password</label>
                            <input
                                type="password"
                                id="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                                className="w-full p-2 border rounded text-black"
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="permission" className="block text-sm font-semibold text-gray-700">Permission</label>
                            <select
                                id="permission"
                                value={formData.permission}
                                onChange={(e) => setFormData({ ...formData, permission: e.target.value })}
                                className="w-full p-2 border rounded text-black"
                            >
                                <option value="read_only">Read Only</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
                        <div className="flex justify-between">
                            <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded shadow">
                                Create User
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="bg-gray-500 text-white px-4 py-2 rounded shadow"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </nav>
    );
}
