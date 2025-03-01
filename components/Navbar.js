import { useRouter } from "next/router";

export default function Navbar({ session }) {
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem("user");
        router.push("/login");
    };

    return (
        <nav className="bg-blue-600 text-white p-4 shadow-md flex justify-between items-center">
            <h1 className="text-xl font-bold cursor-pointer" onClick={() => router.push("/dashboard")}>
                User Management
            </h1>
            <div className="flex space-x-4">
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
        </nav>
    );
}
