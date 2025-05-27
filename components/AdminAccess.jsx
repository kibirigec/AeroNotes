/**
 * Admin Access Component
 * Provides quick access to admin features like monitoring
 * 
 * Usage in src/app pages:
 * import AdminAccess from '../../../components/AdminAccess';
 * 
 * Usage in root-level pages:
 * import AdminAccess from './components/AdminAccess';
 */

import Link from 'next/link';

const AdminAccess = ({ className = "" }) => {
  // Check if user is authenticated
  if (typeof window === 'undefined') return null;
  
  const userId = localStorage.getItem('userId');
  if (!userId) return null;

  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Admin Tools</h3>
      <div className="space-y-2">
        <Link
          href="/admin/monitoring"
          className="flex items-center p-3 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <span className="mr-3 text-xl">📊</span>
          <div>
            <div className="font-medium">System Monitoring</div>
            <div className="text-sm text-gray-600">View system health, metrics & alerts</div>
          </div>
        </Link>
        
        <Link
          href="/api/health"
          target="_blank"
          className="flex items-center p-3 text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
        >
          <span className="mr-3 text-xl">🏥</span>
          <div>
            <div className="font-medium">Health Check</div>
            <div className="text-sm text-gray-600">Quick system health status</div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default AdminAccess; 