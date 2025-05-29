/**
 * Account Settings Component
 * Settings for managing user account and data
 */

import { useState } from 'react';

const AccountSettings = ({ user }) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  const handleDeleteAccount = () => {
    // This would implement account deletion
    console.log('Account deletion requested');
    setShowDeleteDialog(false);
  };

  const handleExportData = () => {
    // This would implement data export
    console.log('Data export requested');
    setShowExportDialog(false);
  };

  return (
    <div className="space-y-6">
      {/* Account Info */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Account Information</h3>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</span>
            <span className="text-sm text-gray-900 dark:text-gray-100">{user?.email}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">User ID</span>
            <span className="text-sm text-gray-900 dark:text-gray-100 font-mono">{user?.id?.substring(0, 8)}...</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Account Created</span>
            <span className="text-sm text-gray-900 dark:text-gray-100">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Sign In</span>
            <span className="text-sm text-gray-900 dark:text-gray-100">
              {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Unknown'}
            </span>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Data Management</h3>
        <div className="space-y-4">
          {/* Export Data */}
          <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Export Your Data</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Download all your notes, images, and documents</p>
            </div>
            <button
              onClick={() => setShowExportDialog(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Export Data
            </button>
          </div>

          {/* Clear Cache */}
          <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Clear Local Cache</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Clear cached data to free up space</p>
            </div>
            <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm">
              Clear Cache
            </button>
          </div>
        </div>
      </div>

      {/* Privacy & Security */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Privacy & Security</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Analytics & Crash Reports</label>
              <p className="text-xs text-gray-500 dark:text-gray-400">Help improve the app by sharing usage data</p>
            </div>
            <input 
              type="checkbox" 
              defaultChecked 
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Notifications</label>
              <p className="text-xs text-gray-500 dark:text-gray-400">Receive important updates via email</p>
            </div>
            <input 
              type="checkbox" 
              defaultChecked 
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="border-t border-red-200 dark:border-red-700 pt-6">
        <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-4">Danger Zone</h3>
        <div className="space-y-4">
          <div className="border border-red-200 dark:border-red-700 rounded-lg p-4 bg-red-50 dark:bg-red-900/20">
            <h4 className="text-sm font-medium text-red-900 dark:text-red-200">Delete Account</h4>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Export Data Dialog */}
      {showExportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Export Your Data</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              This will create a downloadable archive containing all your notes, images, and documents. 
              The export may take a few minutes for large amounts of data.
            </p>
            <div className="space-y-3 mb-6">
              <label className="flex items-center">
                <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Include notes</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Include images</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Include documents</span>
              </label>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleExportData}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Export
              </button>
              <button
                onClick={() => setShowExportDialog(false)}
                className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-4">Delete Account</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete your account? This will permanently remove:
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 mb-6 list-disc list-inside space-y-1">
              <li>All your notes and text content</li>
              <li>All uploaded images and documents</li>
              <li>Your account settings and preferences</li>
              <li>All associated data and backups</li>
            </ul>
            <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-6">
              This action cannot be undone. Please make sure you have exported any data you want to keep.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleDeleteAccount}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Yes, Delete My Account
              </button>
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSettings; 