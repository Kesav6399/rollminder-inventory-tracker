import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getClient, getClientOrders, getReminders, getProducts, updateClient } from '../services/api';

function ClientDetail() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [orders, setOrders] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('info');
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    gst_number: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [clientRes, ordersRes, remindersRes, productsRes] = await Promise.all([
        getClient(id),
        getClientOrders(id),
        getReminders(id),
        getProducts(),
      ]);
      setClient(clientRes.data);
      setOrders(ordersRes.data);
      setReminders(remindersRes.data);
      setProducts(productsRes.data);
      setFormData({
        name: clientRes.data.name || '',
        contact_person: clientRes.data.contact_person || '',
        phone: clientRes.data.phone || '',
        email: clientRes.data.email || '',
        address: clientRes.data.address || '',
        gst_number: clientRes.data.gst_number || '',
        notes: clientRes.data.notes || '',
      });
    } catch (error) {
      console.error('Error fetching client data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClient = async (data) => {
    try {
      await updateClient(id, data);
      setIsEditing(false);
      fetchData();
    } catch (error) {
      console.error('Error updating client:', error);
    }
  };

  const getStatusBadge = (expiryDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(expiryDate);
    dueDate.setHours(0, 0, 0, 0);
    const daysLeft = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">Overdue</span>;
    }
    if (daysLeft <= 2) {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">Due Soon</span>;
    }
    if (daysLeft <= 7) {
      return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">Upcoming</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Safe</span>;
  };

  const getReminderStatusBadge = (status, daysLeft) => {
    if (status === 'completed') {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">Completed</span>;
    }
    if (daysLeft <= 0) {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">Due Today</span>;
    }
    if (daysLeft <= 3) {
      return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">Due Soon</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">Pending</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!client) {
    return <div className="text-center py-8 text-gray-500">Client not found</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <Link to="/clients" className="text-blue-600 hover:text-blue-900 mb-2 inline-block">
          ← Back to Clients
        </Link>
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Edit Client</h3>
          <form onSubmit={(e) => { e.preventDefault(); handleUpdateClient(formData); }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.gst_number}
                  onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea
                className="w-full px-3 py-2 border rounded-md"
                rows="2"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                className="w-full px-3 py-2 border rounded-md"
                rows="2"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save Changes
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-6 py-3 font-medium ${activeTab === 'info' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          >
            Client Info
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-3 font-medium ${activeTab === 'orders' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          >
            Delivery History ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('reminders')}
            className={`px-6 py-3 font-medium ${activeTab === 'reminders' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          >
            Reminders ({reminders.length})
          </button>
        </div>
      </div>

      {activeTab === 'info' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Contact Person:</span>
                  <span className="font-medium">{client.contact_person || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-medium">{client.phone || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{client.email || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">GST Number:</span>
                  <span className="font-medium">{client.gst_number || '-'}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Address</h3>
              <p className="text-gray-600">{client.address || 'No address provided'}</p>
            </div>
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold mb-4">Notes</h3>
              <p className="text-gray-600">{client.notes || 'No notes'}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {orders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No delivery history</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bill #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">{order.product_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{order.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">₹{Number(order.total_amount || order.price_per_unit * order.quantity).toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{order.order_date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{order.expiry_date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{order.bill_number || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(order.expiry_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'reminders' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {reminders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No reminders</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reminder Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reminders.map((reminder) => (
                    <tr key={reminder.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">{reminder.product_name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{reminder.expiry_date || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{reminder.reminder_date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{reminder.reminder_type}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getReminderStatusBadge(reminder.status, reminder.days_left)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ClientDetail;