import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getReminders,
  createReminder,
  updateReminder,
  completeReminder,
  deleteReminder,
  testSendReminder,
  getClients,
  getOrders
} from '../services/api';

function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [clients, setClients] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [filter, setFilter] = useState('upcoming');

  const [formData, setFormData] = useState({
    client_id: '',
    order_id: '',
    reminder_type: 'email',
    reminder_date: new Date().toISOString().split('T')[0],
    reminder_time: '09:00',
    message: '',
  });

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [remRes, clientRes, orderRes] = await Promise.all([
        filter === 'upcoming' ? getReminders('', 'pending') : getReminders(),
        getClients(),
        getOrders(),
      ]);
      setReminders(remRes.data);
      setClients(clientRes.data);
      setOrders(orderRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.client_id || !formData.reminder_date) {
      setError('Client and reminder date are required');
      return;
    }

    try {
      if (editingReminder) {
        await updateReminder(editingReminder.id, formData);
        setSuccess('Reminder updated successfully!');
      } else {
        await createReminder(formData);
        setSuccess('Reminder created successfully!');
      }

      setShowForm(false);
      setEditingReminder(null);
      setFormData({
        client_id: '',
        order_id: '',
        reminder_type: 'email',
        reminder_date: new Date().toISOString().split('T')[0],
        reminder_time: '09:00',
        message: '',
      });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to save reminder');
    }
  };

  const handleComplete = async (id) => {
    try {
      await completeReminder(id);
      setSuccess('Reminder marked as completed!');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to complete reminder');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this reminder permanently?')) return;
    try {
      await deleteReminder(id);
      setSuccess('Reminder deleted');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete reminder');
    }
  };

  const handleTest = async (id) => {
    try {
      const res = await testSendReminder(id);
      const data = res.data;
      if (data.success) {
        const emailMsg = data.emailResult?.status === 'sent' ? 'Email sent' :
                        data.emailResult?.status === 'skipped' ? 'Email skipped: ' + (data.emailResult?.message || 'not configured') :
                        'Email failed';
        const smsMsg = data.smsResult?.status === 'sent' ? 'SMS sent' :
                       data.smsResult?.status === 'skipped' ? 'SMS skipped: ' + (data.smsResult?.message || 'not configured') :
                       'SMS failed';
        setToast(`Test executed: ${emailMsg}; ${smsMsg}. Check server logs.`);
      } else {
        setError(data.error || 'Test reminder failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send test reminder');
    }
  };

  const handleEdit = (reminder) => {
    setEditingReminder(reminder);
    setFormData({
      client_id: reminder.client_id || '',
      order_id: reminder.order_id || '',
      reminder_type: reminder.reminder_type || 'email',
      reminder_date: reminder.reminder_date || '',
      reminder_time: reminder.reminder_time || '09:00',
      message: reminder.message || '',
    });
    setShowForm(true);
  };

  const setToast = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 5000);
  };

  const getStatusBadge = (status, daysLeft) => {
    if (status === 'completed') return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">Completed</span>;
    if (daysLeft <= 0) return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">Due Today</span>;
    if (daysLeft <= 3) return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">{daysLeft}d left</span>;
    return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">Pending</span>;
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Unknown';
  };

  const getOrderInfo = (orderId) => {
    if (!orderId) return { product_name: '-', quantity: '-' };
    const order = orders.find(o => o.id === orderId);
    if (!order) return { product_name: '-', quantity: '-' };
    return {
      product_name: order.product_name || 'Unknown',
      quantity: order.quantity || '-',
      expiry_date: order.expiry_date || '-',
    };
  };

  return (
    <div className="p-4">
      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-3 rounded mb-4 flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500">&times;</button>
        </div>
      )}
      {success && (
        <div className="bg-green-100 text-green-700 px-4 py-3 rounded mb-4 flex justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="text-green-500">&times;</button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Reminders</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingReminder(null);
            setFormData({
              client_id: '',
              order_id: '',
              reminder_type: 'email',
              reminder_date: new Date().toISOString().split('T')[0],
              reminder_time: '09:00',
              message: '',
            });
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 whitespace-nowrap"
        >
          {showForm ? 'Cancel' : 'Create Reminder'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('upcoming')}
          className={`px-4 py-2 rounded font-medium transition-colors ${
            filter === 'upcoming'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All Reminders
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">{editingReminder ? 'Edit Reminder' : 'New Reminder'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
                <select
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value, order_id: '' })}
                  required
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Client</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order (Optional)</label>
                <select
                  value={formData.order_id}
                  onChange={(e) => setFormData({ ...formData, order_id: e.target.value })}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Order (if any)</option>
                  {orders
                    .filter(o => !formData.client_id || o.client_id === formData.client_id)
                    .map(o => (
                      <option key={o.id} value={o.id}>
                        {o.product_name} - Due: {o.expiry_date}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reminder Type</label>
                <select
                  value={formData.reminder_type}
                  onChange={(e) => setFormData({ ...formData, reminder_type: e.target.value })}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="app">App Only</option>
                  <option value="all">All (Email + SMS)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={formData.reminder_date}
                  onChange={(e) => setFormData({ ...formData, reminder_date: e.target.value })}
                  required
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input
                  type="time"
                  value={formData.reminder_time}
                  onChange={(e) => setFormData({ ...formData, reminder_time: e.target.value })}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows="2"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Custom reminder message (optional)"
              />
            </div>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              {editingReminder ? 'Update Reminder' : 'Create Reminder'}
            </button>
          </form>
        </div>
      )}

      {/* Reminders Table */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : reminders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          {filter === 'upcoming' ? 'No upcoming reminders' : 'No reminders found'}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reminder Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reminders.map((r) => {
                const orderInfo = r.order_id ? getOrderInfo(r.order_id) : null;
                return (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Link to={`/clients/${r.client_id}`} className="text-blue-600 hover:text-blue-900 font-medium">
                        {r.client_name}
                      </Link>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-600">
                      {orderInfo?.product_name || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-600">
                      {orderInfo?.quantity || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-600">
                      {r.expiry_date || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-600">
                      {r.reminder_date}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-600">
                      {r.reminder_time}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 capitalize">
                        {r.reminder_type}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {getStatusBadge(r.status, r.days_left)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      {r.status !== 'completed' && (
                        <>
                          <button
                            onClick={() => handleComplete(r.id)}
                            className="text-green-600 hover:text-green-900 text-sm mr-2"
                            title="Mark Complete"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => handleTest(r.id)}
                            className="text-purple-600 hover:text-purple-900 text-sm mr-2"
                            title="Send Test"
                          >
                            Test
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleEdit(r)}
                        className="text-blue-600 hover:text-blue-900 text-sm mr-2"
                        title="Edit"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="text-red-600 hover:text-red-900 text-sm"
                        title="Delete"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Reminders;
