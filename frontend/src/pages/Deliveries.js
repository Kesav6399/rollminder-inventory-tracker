import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getClients, getProducts, getOrders, createOrder } from '../services/api';

function Deliveries() {
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reminderDays, setReminderDays] = useState([3]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    client_id: '',
    product_id: '',
    quantity: '',
    price_per_unit: '',
    order_date: '',
    expiry_date: '',
    bill_number: '',
    payment_status: 'unpaid',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [clientsRes, productsRes, ordersRes] = await Promise.all([
        getClients(),
        getProducts(),
        getOrders(),
      ]);
      setClients(clientsRes.data);
      setProducts(productsRes.data);
      setOrders(ordersRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    }
  };

  const handleProductChange = (e) => {
    const productId = e.target.value;
    const selectedProduct = products.find((p) => p.id === productId);
    setFormData({
      ...formData,
      product_id: productId,
      price_per_unit: selectedProduct ? selectedProduct.unit_price : '',
      quantity: selectedProduct ? selectedProduct.default_quantity || '' : '',
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleReminderDaysChange = (day) => {
    if (reminderDays.includes(day)) {
      setReminderDays(reminderDays.filter((d) => d !== day));
    } else {
      setReminderDays([...reminderDays, day].sort((a, b) => b - a));
    }
  };

  const calculateTotal = () => {
    return Number(formData.quantity || 0) * Number(formData.price_per_unit || 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.client_id || !formData.product_id || !formData.quantity || !formData.price_per_unit || !formData.expiry_date) {
      setError('Please fill client, product, quantity, price, and next due date.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        quantity: Number(formData.quantity),
        price_per_unit: Number(formData.price_per_unit),
        total_amount: calculateTotal(),
        order_date: formData.order_date || new Date().toISOString().split('T')[0],
        reminder_days: reminderDays.length > 0 ? reminderDays : [3],
      };

      await createOrder(payload);

      setSuccess('Delivery added successfully! Reminders have been created automatically.');
      setFormData({
        client_id: '',
        product_id: '',
        quantity: '',
        price_per_unit: '',
        order_date: '',
        expiry_date: '',
        bill_number: '',
        payment_status: 'unpaid',
        notes: '',
      });
      setReminderDays([3]);
      fetchData();
    } catch (err) {
      console.error('Error creating delivery:', err);
      setError(err.message || 'Failed to create delivery');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (expiryDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(expiryDate);
    dueDate.setHours(0, 0, 0, 0);
    const daysLeft = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">Overdue</span>;
    if (daysLeft <= 2) return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">Due Soon</span>;
    if (daysLeft <= 7) return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">Upcoming</span>;
    return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Safe</span>;
  };

  return (
    <div className="p-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex justify-between items-start">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 ml-4">&times;</button>
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex justify-between items-start">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-700 ml-4">&times;</button>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Deliveries</h1>
        <p className="text-gray-500 mt-1">Add client deliveries and set the next delivery due date.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow border p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Delivery</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
              <select
                name="client_id"
                value={formData.client_id}
                onChange={handleChange}
                required
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product *</label>
              <select
                name="product_id"
                value={formData.product_id}
                onChange={handleProductChange}
                required
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} - ₹{p.unit_price}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                  min="1"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price/Unit *</label>
                <input
                  type="number"
                  name="price_per_unit"
                  value={formData.price_per_unit}
                  onChange={handleChange}
                  required
                  step="0.01"
                  min="0"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="bg-gray-50 rounded p-3">
              <p className="text-sm text-gray-600">Total: <span className="font-bold text-lg">₹{calculateTotal().toFixed(2)}</span></p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label>
              <input
                type="date"
                name="order_date"
                value={formData.order_date}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Next Delivery Due Date *</label>
              <input
                type="date"
                name="expiry_date"
                value={formData.expiry_date}
                onChange={handleChange}
                required
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Reminders will be sent before this date</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reminder Days Before</label>
              <div className="flex gap-4">
                {[7, 3, 1].map((day) => (
                  <label key={day} className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reminderDays.includes(day)}
                      onChange={() => handleReminderDaysChange(day)}
                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{day} day{day > 1 ? 's' : ''} before</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bill Number (Optional)</label>
              <input
                type="text"
                name="bill_number"
                value={formData.bill_number}
                onChange={handleChange}
                placeholder="e.g., INV-001"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
              <select
                name="payment_status"
                value={formData.payment_status}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="2"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Additional notes..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Add Delivery'}
            </button>
          </form>
        </div>

        {/* Table */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Delivery History</h2>
            <p className="text-sm text-gray-500">All past and upcoming deliveries</p>
          </div>
          <div className="overflow-x-auto">
            {orders.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No deliveries yet</div>
            ) : (
              <table className="w-full min-w-[600px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Link to={`/clients/${o.client_id}`} className="text-blue-600 hover:text-blue-900 font-medium">
                          {o.client_name}
                        </Link>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-gray-600">{o.product_name}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-gray-600">{o.quantity}</td>
                      <td className="px-4 py-4 whitespace-nowrap font-medium">₹{Number(o.total_amount).toFixed(2)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-gray-600">{o.expiry_date}</td>
                      <td className="px-4 py-4 whitespace-nowrap">{getStatusBadge(o.expiry_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Deliveries;
