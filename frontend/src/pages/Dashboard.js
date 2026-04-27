import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSummary, getUpcomingReminders, completeReminder } from '../services/api';

function Dashboard() {
  const [summary, setSummary] = useState({
    total_clients: 0,
    total_products: 0,
    total_orders: 0,
    upcoming_expiry_7_days: 0,
    due_today: 0,
    overdue: 0,
    total_unpaid_bills: 0,
    pending_reminders: 0,
  });
  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [currentReminder, setCurrentReminder] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchData();
    checkNotificationPermission();
  }, []);

  const fetchData = async () => {
    try {
      const [summaryRes, remindersRes] = await Promise.all([
        getSummary(),
        getUpcomingReminders(),
      ]);
      setSummary(summaryRes.data);
      setUpcomingReminders(remindersRes.data);

      const dueSoon = remindersRes.data.filter(r => r.days_left <= 3);
      if (dueSoon.length > 0) {
        const shownIds = JSON.parse(localStorage.getItem('shownReminderIds') || '[]');
        const next = dueSoon.find(r => !shownIds.includes(r.id));
        if (next) {
          setCurrentReminder(next);
          setShowReminderModal(true);
          if (Notification.permission === 'granted') {
            new Notification('RollMinder Reminder', {
              body: `Prepare next order for ${next.client_name}. Due in ${next.days_left} days.`,
              icon: '/favicon.ico',
            });
          }
        }
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkNotificationPermission = () => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        setToast({ message: 'Browser notifications enabled!', type: 'success' });
      } else {
        setToast({ message: 'Notification permission denied', type: 'error' });
      }
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleMarkComplete = async () => {
    if (!currentReminder) return;
    try {
      await completeReminder(currentReminder.id);
      const shown = JSON.parse(localStorage.getItem('shownReminderIds') || '[]');
      shown.push(currentReminder.id);
      localStorage.setItem('shownReminderIds', JSON.stringify(shown));

      const remaining = upcomingReminders.filter(r => r.id !== currentReminder.id && r.days_left <= 3);
      if (remaining.length > 0) {
        setCurrentReminder(remaining[0]);
      } else {
        setShowReminderModal(false);
        setCurrentReminder(null);
      }
      fetchData();
    } catch (error) {
      console.error('Error completing reminder:', error);
    }
  };

  const handleDismiss = () => {
    if (!currentReminder) return;
    const shown = JSON.parse(localStorage.getItem('shownReminderIds') || '[]');
    shown.push(currentReminder.id);
    localStorage.setItem('shownReminderIds', JSON.stringify(shown));

    const remaining = upcomingReminders.filter(r => r.id !== currentReminder.id && r.days_left <= 3);
    if (remaining.length > 0) {
      setCurrentReminder(remaining[0]);
    } else {
      setShowReminderModal(false);
      setCurrentReminder(null);
    }
  };

  const StatCard = ({ title, value, icon, color }) => (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <div className="flex items-center">
        <div className={`p-2 sm:p-3 rounded-lg ${color}`}>
          {icon}
        </div>
        <div className="ml-3 sm:ml-4">
          <p className="text-xs sm:text-sm font-medium text-gray-500">{title}</p>
          <p className="text-xl sm:text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-md shadow-lg ${
          toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        {notificationPermission === 'default' && (
          <button
            onClick={requestNotificationPermission}
            className="px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-xs sm:text-sm whitespace-nowrap"
          >
            Enable Browser Notifications
          </button>
        )}
        {notificationPermission === 'granted' && (
          <span className="text-xs sm:text-sm text-green-600 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Notifications enabled
          </span>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <StatCard title="Total Clients" value={summary.total_clients} color="bg-blue-100" icon={<svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
        <StatCard title="Total Products" value={summary.total_products} color="bg-green-100" icon={<svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>} />
        <StatCard title="Total Orders" value={summary.total_orders} color="bg-purple-100" icon={<svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>} />
        <StatCard title="Due in 7 Days" value={summary.upcoming_expiry_7_days} color="bg-yellow-100" icon={<svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <StatCard title="Due Today" value={summary.due_today} color="bg-red-100" icon={<svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard title="Overdue" value={summary.overdue} color="bg-red-200" icon={<svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} />
        <StatCard title="Unpaid Bills" value={summary.total_unpaid_bills} color="bg-orange-100" icon={<svg className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} />
        <StatCard title="Pending Reminders" value={summary.pending_reminders} color="bg-indigo-100" icon={<svg className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>} />
      </div>

      {/* Upcoming Deliveries Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Upcoming Deliveries</h3>
          <p className="text-sm text-gray-500">Orders expiring in the next 14 days</p>
        </div>

        {upcomingReminders.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No upcoming deliveries</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Left</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {upcomingReminders.map((item) => {
                  const badgeColor = item.badge_status === 'green' ? 'bg-green-100 text-green-800' :
                                   item.badge_status === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                   'bg-red-100 text-red-800';
                  const label = item.days_left <= 0 ? 'Overdue' : `${item.days_left} days left`;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <Link to={`/clients/${item.client_id}`} className="text-blue-600 hover:text-blue-900 font-medium">
                          {item.client_name}
                        </Link>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-600">{item.product_name || '-'}</td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-600">{item.order_quantity || '-'}</td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-600">{item.expiry_date}</td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap font-medium">{item.days_left}</td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeColor}`}>{label}</span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <Link to={`/clients/${item.client_id}`} className="text-blue-600 hover:text-blue-900 text-sm">View</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reminder Modal Popup */}
      {showReminderModal && currentReminder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Delivery Reminder</h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between"><span className="text-gray-600">Client:</span><span className="font-medium">{currentReminder.client_name}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Product:</span><span className="font-medium">{currentReminder.product_name || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Quantity:</span><span className="font-medium">{currentReminder.order_quantity || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Due Date:</span><span className="font-medium">{currentReminder.expiry_date}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Reminder Date:</span><span className="font-medium">{currentReminder.reminder_date}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Message:</span><span className="font-medium">{currentReminder.message || 'N/A'}</span></div>
            </div>
            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <button onClick={handleDismiss} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Dismiss</button>
              <div className="flex gap-2">
                <Link to={`/clients/${currentReminder.client_id}`} className="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 text-center">View Client</Link>
                <button onClick={handleMarkComplete} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Mark Completed</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
