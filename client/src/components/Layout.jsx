import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar currentPath={location.pathname} />
      {/* Offset content for desktop sidebar and mobile header */}
      <div className="md:pl-64 pt-14 md:pt-0">
        <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
      </div>
    </div>
  );
}
