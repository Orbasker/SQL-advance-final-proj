import { useState } from "react";
import { useRouter } from "next/router";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [users, setUsers] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ username: "", password: "", permission: "read_only" });
    const router = useRouter();

    const handleLogin = async (e) => {
        e.preventDefault();

        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });

        const result = await response.json();

        if (!response.ok) {
            setError(result.error || "Invalid username or password.");
            return;
        }

        localStorage.setItem("user", JSON.stringify(result));
        router.push("/dashboard");
    };
    
    const handleUserRegistration = async (e) => {
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
    };

    return (
        <div className="flex justify-center items-center h-screen bg-gray-200">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                <h2 className="text-2xl font-bold mb-4">Login</h2>
                {error && <p className="text-red-500">{error}</p>}
                <form onSubmit={handleLogin} className="space-y-4">
                    <input
                        type="text"
                        placeholder="Username"
                        className="w-full p-2 border rounded"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        className="w-full p-2 border rounded"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                    >
                        Login
                    </button>
                </form>
            </div>
            <br></br>
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                <button onClick={() => setShowForm(true)} className="bg-green-500 text-white px-4 py-2 rounded shadow">
                    + Register
                </button>
            </div>

            {showForm && (
                <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg mx-auto">
                    <h2 className="text-xl font-bold mb-4">Create New User</h2>
                    {error && <p className="text-red-500">{error}</p>}
                    <form onSubmit={handleUserRegistration} className="space-y-4">
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

                        {/* Hidden input to always send "read_only" */}
                        <input type="hidden" name="permission" value="read_only" />

                        <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
                            Create User
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
