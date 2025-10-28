import React, { useEffect, useState } from 'react';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/bazaar/orders?role=buyer', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await res.json();
        if (data.success) {
          setOrders(data.data.orders || []);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to load orders', e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-indigo-100 text-indigo-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600 mt-2">Track your purchases and delivery status</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {orders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">You haven't placed any orders yet.</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {orders.map((order) => (
                <div key={order._id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Order #{order._id.slice(-8)}</h3>
                      <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>{order.status}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <p className="text-sm text-gray-600">Seller</p>
                      <p className="font-medium text-gray-900">{order.sellerId?.shopName || order.sellerId?.name || 'Seller'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="font-medium text-gray-900">₹{Number(order.totalAmount || 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Items</p>
                      <p className="font-medium text-gray-900">{order.items?.length || 0}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Items</h4>
                    <div className="space-y-2">
                      {order.items?.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">{it.productId?.name || 'Product'}</span>
                          <span className="text-gray-500">{it.quantity} × ₹{Number(it.price || 0).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {order.trackingInfo?.trackingNumber && (
                    <div className="mt-4 p-3 bg-gray-50 rounded border text-sm">
                      <div className="flex flex-wrap gap-4">
                        <div><span className="text-gray-600">Tracking:</span> <span className="font-medium">{order.trackingInfo.trackingNumber}</span></div>
                        {order.trackingInfo.carrier && (<div><span className="text-gray-600">Carrier:</span> <span className="font-medium">{order.trackingInfo.carrier}</span></div>)}
                        {order.trackingInfo.estimatedDelivery && (<div><span className="text-gray-600">ETA:</span> <span className="font-medium">{new Date(order.trackingInfo.estimatedDelivery).toLocaleDateString()}</span></div>)}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Orders;


