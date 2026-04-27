import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBills, createBill, updateBill, deleteBill, getClients, getBillsFromOrders } from '../services/api';

const BillForm = ({ clients, bill, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    client_id: bill?.client_id || '',
    bill_number: bill?.bill_number || '',
    bill_date: bill?.bill_date || new Date().toISOString().split('T')[0],
    due_date: bill?.due_date || '',
    total_amount: bill?.total_amount || 0,
    paid_amount: bill?.paid_amount || 0,
    payment_status: bill?.payment_status || 'unpaid',
    notes: bill?.notes || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
        <select
          required
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.client_id}
          onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
        >
          <option value="">Select Client</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bill Number</label>
          <input
            type="text"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.bill_number}
            onChange={(e) => setFormData({ ...formData, bill_number: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bill Date *</label>
          <input
            type="date"
            required
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.bill_date}
            onChange={(e) => setFormData({ ...formData, bill_date: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
          <input
            type="date"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount *</label>
          <input
            type="number"
            required
            step="0.01"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.total_amount}
            onChange={(e) => setFormData({ ...formData, total_amount: parseFloat(e.target.value) || 0 })}
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="2"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {bill ? 'Update' : 'Create'} Bill
        </button>
      </div>
    </form>
  );
};

function Bills() {
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchData();
  }, [search, filter]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    try {
      const [ordersRes, clientsRes] = await Promise.all([
        getBillsFromOrders('', filter),
        getClients()
      ]);
      setOrders(ordersRes.data);
      setClients(clientsRes.data);
    } catch (error) {
      console.error('Error fetching bills:', error);
      showToast('Failed to load bills', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBill = async (data) => {
    try {
      await createBill(data);
      setShowForm(false);
      showToast('Bill created successfully');
      fetchData();
    } catch (error) {
      console.error('Error creating bill:', error);
      showToast('Failed to create bill', 'error');
    }
  };

  const handleUpdateBill = async (data) => {
    try {
      await updateBill(editingBill.id, data);
      setEditingBill(null);
      showToast('Bill updated successfully');
      fetchData();
    } catch (error) {
      console.error('Error updating bill:', error);
      showToast('Failed to update bill', 'error');
    }
  };

  const handleDeleteBill = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bill?')) return;
    try {
      await deleteBill(id);
      showToast('Bill deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting bill:', error);
      showToast('Failed to delete bill', 'error');
    }
  };

  const handleMarkPaid = async (bill) => {
    try {
      const updateData = {
        ...bill,
        payment_status: 'paid',
      };
      await updateBill(bill.id, updateData);
      showToast('Bill marked as paid');
      fetchData();
    } catch (error) {
      console.error('Error marking bill as paid:', error);
      showToast('Failed to update bill', 'error');
    }
  };

  const handleMarkPartial = async (bill) => {
    try {
      const updateData = {
        ...bill,
        payment_status: 'partial',
        paid_amount: bill.total_amount * 0.5,
      };
      await updateBill(bill.id, updateData);
      showToast('Bill marked as partial');
      fetchData();
    } catch (error) {
      console.error('Error marking bill as partial:', error);
      showToast('Failed to update bill', 'error');
    }
  };

  const StatusBadge = ({ status }) => {
    const colors = {
      paid: 'bg-green-100 text-green-800',
      unpaid: 'bg-red-100 text-red-800',
      partial: 'bg-yellow-100 text-yellow-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.unpaid}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const filteredOrders = orders.filter(order => {
    if (search) {
      const searchLower = search.toLowerCase();
      return order.client_name.toLowerCase().includes(searchLower) || 
             (order.bill_number && order.bill_number.toLowerCase().includes(searchLower));
    }
    return true;
  });

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
        <h2 className="text-2xl font-bold text-gray-800">Bills & Payments</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 whitespace-nowrap"
        >
          {showForm ? 'Cancel' : 'Create Bill'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">New Bill</h3>
          <BillForm
            clients={clients}
            onSubmit={handleCreateBill}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by client name or bill number..."
          className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">All Bills</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
          <option value="partial">Partial</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No bills found
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bill #</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.map((bill) => (
                <tr key={bill.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-gray-900">{bill.bill_number || '-'}</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <Link to={`/clients/${bill.client_id}`} className="text-blue-600 hover:text-blue-900 font-medium">
                      {bill.client_name}
                    </Link>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-gray-600">{bill.bill_date}</td>
                  <td className="px-4 py-4 whitespace-nowrap font-medium">₹{parseFloat(bill.total_amount).toFixed(2)}</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <StatusBadge status={bill.payment_status} />
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex flex-wrap justify-end gap-2">
                      {bill.payment_status === 'unpaid' && (
                        <>
                          <button
                            onClick={() => handleMarkPaid(bill)}
                            className="text-green-600 hover:text-green-900 text-xs px-2 py-1"
                          >
                            Mark Paid
                          </button>
                          <button
                            onClick={() => handleMarkPartial(bill)}
                            className="text-yellow-600 hover:text-yellow-900 text-xs px-2 py-1"
                          >
                            Partial
                          </button>
                        </>
                      )}
                      {bill.payment_status === 'partial' && (
                        <button
                          onClick={() => handleMarkPaid(bill)}
                          className="text-green-600 hover:text-green-900 text-xs px-2 py-1"
                        >
                          Mark Full Paid
                        </button>
                      )}
                      <button
                        onClick={() => setEditingBill(bill)}
                        className="text-blue-600 hover:text-blue-900 text-xs px-2 py-1"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteBill(bill.id)}
                        className="text-red-600 hover:text-red-900 text-xs px-2 py-1"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Edit Bill</h3>
            <BillForm
              clients={clients}
              bill={editingBill}
              onSubmit={handleUpdateBill}
              onCancel={() => setEditingBill(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Bills;