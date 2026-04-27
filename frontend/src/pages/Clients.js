import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getClients, createClient, updateClient, deleteClient } from '../services/api';

function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

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
    fetchClients();
  }, [search]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await getClients(search);
      setClients(res.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.name) {
      setError('Client name is required');
      return;
    }

    try {
      if (editingClient) {
        await updateClient(editingClient.id, formData);
        setSuccess('Client updated!');
      } else {
        await createClient(formData);
        setSuccess('Client created!');
      }

      setFormData({ name: '', contact_person: '', phone: '', email: '', address: '', gst_number: '', notes: '' });
      setShowForm(false);
      setEditingClient(null);
      fetchClients();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to save client');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this client?')) return;
    try {
      await deleteClient(id);
      setSuccess('Client deleted');
      fetchClients();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete client');
    }
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setFormData({
      name: client.name || '',
      contact_person: client.contact_person || '',
      phone: client.phone || '',
      email: client.email || '',
      address: client.address || '',
      gst_number: client.gst_number || '',
      notes: client.notes || '',
    });
    setShowForm(true);
  };

  const getStatus = (nextExpiry) => {
    if (!nextExpiry) return { status: 'gray', label: 'No orders' };
    const daysLeft = Math.ceil((new Date(nextExpiry) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 2) return { status: 'red', label: `${daysLeft}d left` };
    if (daysLeft <= 7) return { status: 'yellow', label: `${daysLeft}d left` };
    return { status: 'green', label: `${daysLeft}d left` };
  };

  return (
    <div className="p-4">
      {error && <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-100 text-green-700 px-4 py-2 rounded mb-4">{success}</div>}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Clients</h2>
        <button onClick={() => { setShowForm(!showForm); setEditingClient(null); setFormData({ name: '', contact_person: '', phone: '', email: '', address: '', gst_number: '', notes: '' }); }} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          {showForm ? 'Cancel' : 'Add Client'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">{editingClient ? 'Edit Client' : 'New Client'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Name *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium">Contact Person</label>
                <input type="text" value={formData.contact_person} onChange={(e) => setFormData({...formData, contact_person: e.target.value})} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium">Phone</label>
                <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium">Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full border rounded px-3 py-2" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium">Address</label>
              <textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} rows="2" className="w-full border rounded px-3 py-2" />
            </div>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              {editingClient ? 'Update' : 'Add'} Client
            </button>
          </form>
        </div>
      )}

      <div className="mb-4">
        <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full px-4 py-2 border rounded" />
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : clients.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">No clients found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => {
            const stat = getStatus(client.next_expiry);
            return (
              <div key={client.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-start mb-2">
                  <Link to={`/clients/${client.id}`} className="font-semibold text-blue-600 hover:underline">{client.name}</Link>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(client)} className="text-blue-500 hover:text-blue-700 text-sm">Edit</button>
                    <button onClick={() => handleDelete(client.id)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
                  </div>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  {client.phone && <p>📞 {client.phone}</p>}
                  {client.email && <p>✉️ {client.email}</p>}
                </div>
                <div className="mt-3 pt-2 border-t">
                  <span className={`px-2 py-1 text-xs rounded-full ${stat.status === 'red' ? 'bg-red-100 text-red-700' : stat.status === 'yellow' ? 'bg-yellow-100 text-yellow-700' : stat.status === 'green' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {stat.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Clients;