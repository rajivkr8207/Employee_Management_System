import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppLayout() {
    return (
        <div className="min-h-screen bg-[var(--background)]">
            {/* Fixed desktop sidebar */}
            <Sidebar />

            {/* Main content — offset by sidebar on desktop */}
            <div className="md:ml-[260px]">
                {/* Fixed topbar */}
                <Topbar />

                {/* Page content — push down by topbar height */}
                <main className="pt-16 p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
