import React, { useState, useEffect } from 'react';
import { getCurrentUser } from '../services/api';

function Settings() {
  const [emailConfig, setEmailConfig] = useState({ configured: false, host: '', from: '', owner: '' });
  const [smsConfig, setSmsConfig] = useState({ configured: false, sid: '', phone: '' });
  const [notification, setNotification] = useState({ permission: 'default', browserSupported: false });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkBrowserNotifications();
    fetchUser();
  }, []);

  const checkBrowserNotifications = () => {
    const supported = 'Notification' in window;
    const permission = supported ? Notification.permission : 'unsupported';
    setNotification({ browserSupported: supported, permission });
  };

  const requestNotificationPermission = async () => {
    if (!notification.browserSupported) return;
    const permission = await Notification.requestPermission();
    setNotification(prev => ({ ...prev, permission }));
  };

  const fetchUser = async () => {
    try {
      const response = await getCurrentUser();
      setUser(response.data.user);
    } catch (error) {
      console.error('Failed to fetch user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Settings</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Email Configuration */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Email Configuration</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${emailConfig.configured ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {emailConfig.configured ? 'Configured' : 'Not Configured'}
              </span>
            </div>
            {emailConfig.configured && (
              <>
                <div><span className="text-gray-600 block text-sm">SMTP Host:</span> <span className="font-medium">{emailConfig.host}</span></div>
                <div><span className="text-gray-600 block text-sm">From:</span> <span className="font-medium">{emailConfig.from}</span></div>
                <div><span className="text-gray-600 block text-sm">Owner Email:</span> <span className="font-medium">{emailConfig.owner}</span></div>
              </>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM, OWNER_EMAIL in backend .env
            </p>
          </div>
        </div>

        {/* SMS Configuration */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">SMS Configuration</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${smsConfig.configured ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {smsConfig.configured ? 'Configured' : 'Not Configured'}
              </span>
            </div>
            {smsConfig.configured && (
              <>
                <div><span className="text-gray-600 block text-sm">Twilio SID:</span> <span className="font-medium text-xs">••••{smsConfig.sid?.slice(-4)}</span></div>
                <div><span className="text-gray-600 block text-sm">Twilio Number:</span> <span className="font-medium">{smsConfig.phone}</span></div>
              </>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, OWNER_PHONE_NUMBER in backend .env
            </p>
          </div>
        </div>

        {/* Browser Notifications */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Browser Notifications</h3>
          <div className="space-y-3">
            <div><span className="text-gray-600">Browser Support:</span> <span className="font-medium">{notification.browserSupported ? 'Yes' : 'No'}</span></div>
            <div><span className="text-gray-600">Permission:</span> <span className="font-medium capitalize">{notification.permission}</span></div>
            {notification.permission === 'default' && notification.browserSupported && (
              <button
                onClick={requestNotificationPermission}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Enable Notifications
              </button>
            )}
            {notification.permission === 'granted' && (
              <p className="text-green-600 text-sm">Notifications are enabled.</p>
            )}
          </div>
        </div>

        {/* Reminder Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Reminder Defaults</h3>
          <div className="space-y-3">
            <div><span className="text-gray-600">Default Days Before Expiry:</span> <span className="font-medium">3 days</span></div>
            <div><span className="text-gray-600">Default Reminder Time:</span> <span className="font-medium">09:00 AM</span></div>
            <div><span className="text-gray-600">Cron Schedule:</span> <span className="font-medium">Daily at 9:00 AM</span></div>
          </div>
        </div>
      </div>

      {user && (
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Logged-in User</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-600">Name:</span> {user.name}</div>
            <div><span className="text-gray-600">Email:</span> {user.email}</div>
            <div><span className="text-gray-600">Role:</span> <span className="capitalize">{user.role}</span></div>
            <div><span className="text-gray-600">Status:</span> <span className="capitalize">{user.status}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;
