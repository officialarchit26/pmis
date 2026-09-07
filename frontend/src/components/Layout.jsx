import { Outlet } from 'react-router-dom';
import RoleSidebar from './RoleSidebar';

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <RoleSidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}