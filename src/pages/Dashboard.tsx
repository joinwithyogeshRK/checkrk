import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { User, ShoppingBag, Clock, Star } from 'lucide-react';

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  order_items: {
    id: string;
    quantity: number;
    price: number;
    products: {
      name: string;
      image_url: string;
    };
  }[];
}

const Dashboard = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile) {
      fetchOrders();
    }
  }, [profile]);

  const fetchOrders = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log('Fetching orders for user:', user.id);
      
      // Fetch orders, order_items, and products separately
      const [ordersRes, orderItemsRes, productsRes] = await Promise.all([
        supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase.from('order_items').select('*'),
        supabase.from('products').select('*')
      ]);
      
      if (ordersRes.error) {
        console.error('Orders fetch error:', ordersRes.error);
        throw ordersRes.error;
      }
      
      if (orderItemsRes.error) {
        console.error('Order items fetch error:', orderItemsRes.error);
        throw orderItemsRes.error;
      }
      
      if (productsRes.error) {
        console.error('Products fetch error:', productsRes.error);
        throw productsRes.error;
      }
      
      // Manually join the data
      const ordersWithItems = ordersRes.data?.map(order => {
        const orderItems = orderItemsRes.data?.filter(item => item.order_id === order.id) || [];
        
        const itemsWithProducts = orderItems.map(item => {
          const product = productsRes.data?.find(p => p.id === item.product_id);
          return {
            ...item,
            products: product ? {
              name: product.name,
              image_url: product.image_url
            } : {
              name: 'Unknown Product',
              image_url: ''
            }
          };
        });
        
        return {
          ...order,
          order_items: itemsWithProducts
        };
      }) || [];
      
      console.log('Orders loaded:', ordersWithItems.length);
      setOrders(ordersWithItems);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      setError(error.message);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600">Please log in to access your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="bg-primary-100 p-3 rounded-full">
              <User className="w-8 h-8 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Welcome, {profile.full_name || 'User'}!
              </h1>
              <p className="text-gray-600">{profile.email}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-800">{orders.length}</p>
              </div>
              <ShoppingBag className="w-8 h-8 text-primary-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-gray-800">
                  ${orders.reduce((sum, order) => sum + order.total_amount, 0).toFixed(2)}
                </p>
              </div>
              <Star className="w-8 h-8 text-accent-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Recent Orders</p>
                <p className="text-2xl font-bold text-gray-800">
                  {orders.filter(order => {
                    const orderDate = new Date(order.created_at);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return orderDate >= weekAgo;
                  }).length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-secondary-600" />
            </div>
          </div>
        </div>

        {/* Order History */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-800">Order History</h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading orders...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-600">
              <p>Error loading orders: {error}</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center">
              <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No orders yet. Start by browsing our menu!</p>
            </div>
          ) : (
            <div className="divide-y">
              {orders.map((order) => (
                <div key={order.id} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-semibold text-gray-800">
                        Order #{order.id.slice(-8)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      <p className="text-lg font-bold text-gray-800 mt-1">
                        ${order.total_amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-3">
                        <img
                          src={item.products.image_url}
                          alt={item.products.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{item.products.name}</p>
                          <p className="text-sm text-gray-600">
                            Quantity: {item.quantity} × ${item.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;