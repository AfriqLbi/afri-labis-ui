import { Outlet } from "react-router-dom";
import AdminSidebar from "./_components/AdminSidebar.tsx";

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
