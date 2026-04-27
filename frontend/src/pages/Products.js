import React, { useState, useEffect } from 'react';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../services/api';

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    product_type: '',
    description: '',
    unit_price: 0,
    default_quantity: 1,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await getProducts();
      setProducts(res.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.name || !formData.unit_price) {
      setError('Name and price are required');
      return;
    }

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, formData);
        setSuccess('Product updated!');
      } else {
        await createProduct(formData);
        setSuccess('Product created!');
      }

      setFormData({ name: '', product_type: '', description: '', unit_price: 0, default_quantity: 1 });
      setShowForm(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to save product');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await deleteProduct(id);
      setSuccess('Product deleted');
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete product');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      product_type: product.product_type || '',
      description: product.description || '',
      unit_price: product.unit_price || 0,
      default_quantity: product.default_quantity || 1,
    });
    setShowForm(true);
  };

  return (
    <div className="p-4">
      {error && <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-100 text-green-700 px-4 py-2 rounded mb-4">{success}</div>}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Products</h2>
        <button onClick={() => { setShowForm(!showForm); setEditingProduct(null); setFormData({ name: '', product_type: '', description: '', unit_price: 0, default_quantity: 1 }); }} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          {showForm ? 'Cancel' : 'Add Product'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">{editingProduct ? 'Edit Product' : 'New Product'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Name *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium">Type</label>
                <select value={formData.product_type} onChange={(e) => setFormData({...formData, product_type: e.target.value})} className="w-full border rounded px-3 py-2">
                  <option value="">Select</option>
                  <option value="Thermal">Thermal</option>
                  <option value="Bond">Bond</option>
                  <option value="Kraft">Kraft</option>
                  <option value="POS">POS</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Unit Price *</label>
                <input type="number" step="0.01" value={formData.unit_price} onChange={(e) => setFormData({...formData, unit_price: parseFloat(e.target.value) || 0})} required className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium">Default Qty</label>
                <input type="number" value={formData.default_quantity} onChange={(e) => setFormData({...formData, default_quantity: parseInt(e.target.value) || 1})} className="w-full border rounded px-3 py-2" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium">Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows="2" className="w-full border rounded px-3 py-2" />
            </div>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              {editingProduct ? 'Update' : 'Add'} Product
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">No products found</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Price</th>
                <th className="px-4 py-2 text-left">Default Qty</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-2 font-medium">{p.name}</td>
                  <td className="px-4 py-2"><span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">{p.product_type || 'Other'}</span></td>
                  <td className="px-4 py-2">₹{p.unit_price}</td>
                  <td className="px-4 py-2">{p.default_quantity || 1}</td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => handleEdit(p)} className="text-blue-600 hover:underline mr-3">Edit</button>
                    <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Products;