import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadService } from '../../services/uploadService';

const AddProduct = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'handmade',
    stock: 0,
    location: '',
    materials: '', // comma separated
    sustainabilityRating: 3,
    estimatedDays: 7,
    shippingCost: 0,
    tags: '' // comma separated
  });
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  const categories = ['handmade', 'eco-friendly', 'artisan', 'upcycled', 'organic', 'sustainable', 'community-crafted', 'other'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    try {
      setUploading(true);
      const uploaded = [];
      for (const file of files) {
        console.log('Uploading file:', file.name, file.size);
        const res = await uploadService.uploadImage(file);
        console.log('Upload response:', res);
        if (res?.imageURL) {
          uploaded.push(res.imageURL);
        } else if (res?.url) {
          uploaded.push(res.url);
        } else {
          console.error('Unexpected upload response format:', res);
        }
      }
      console.log('Uploaded URLs:', uploaded);
      setImages((prev) => [...prev, ...uploaded]);
    } catch (err) {
      console.error('Upload error details:', err);
      alert(`Image upload failed: ${err.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (url) => {
    setImages((prev) => prev.filter((u) => u !== url));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (images.length === 0) {
      alert('Please upload at least one image');
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: parseFloat(form.price),
      category: form.category,
      images,
      stock: parseInt(form.stock, 10) || 0,
      materials: form.materials
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean),
      sustainabilityRating: parseInt(form.sustainabilityRating, 10) || 3,
      location: form.location.trim(),
      deliveryInfo: {
        estimatedDays: parseInt(form.estimatedDays, 10) || 7,
        shippingCost: parseFloat(form.shippingCost) || 0
      },
      tags: form.tags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
    };

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/bazaar/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        const msg = data?.message || 'Failed to create product';
        alert(`Error: ${msg}`);
        return;
      }
      navigate(`/bazaar/product/${data.data._id}`);
    } catch (err) {
      alert('Failed to create product');
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Add Product</h1>
        <form onSubmit={handleSubmit} className="space-y-6 bg-white border border-gray-200 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
              <input name="name" value={form.name} onChange={handleChange} required className="input-field w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price *</label>
              <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} required className="input-field w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
              <select name="category" value={form.category} onChange={handleChange} className="input-field w-full">
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stock *</label>
              <input name="stock" type="number" min="0" value={form.stock} onChange={handleChange} required className="input-field w-full" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
              <input name="location" value={form.location} onChange={handleChange} required className="input-field w-full" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea name="description" rows="4" value={form.description} onChange={handleChange} required className="input-field w-full" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sustainability Rating</label>
              <input name="sustainabilityRating" type="number" min="1" max="5" value={form.sustainabilityRating} onChange={handleChange} className="input-field w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Days</label>
              <input name="estimatedDays" type="number" min="1" value={form.estimatedDays} onChange={handleChange} className="input-field w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Shipping Cost</label>
              <input name="shippingCost" type="number" min="0" step="0.01" value={form.shippingCost} onChange={handleChange} className="input-field w-full" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Materials (comma separated)</label>
              <input name="materials" value={form.materials} onChange={handleChange} className="input-field w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma separated)</label>
              <input name="tags" value={form.tags} onChange={handleChange} className="input-field w-full" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Images *</label>
            <input type="file" accept="image/*" multiple onChange={handleImageSelect} className="block" />
            {uploading && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
            {images.length > 0 && (
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                {images.map((url) => (
                  <div key={url} className="relative">
                    <img src={url} alt="product" className="w-full h-24 object-cover rounded-lg border" />
                    <button type="button" onClick={() => handleRemoveImage(url)} className="absolute top-1 right-1 text-xs bg-white/80 hover:bg-white px-2 py-1 rounded border">Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => navigate('/bazaar/seller')} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? 'Saving...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;
