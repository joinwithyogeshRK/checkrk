import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Package, Users, DollarSign, ShoppingCart, X } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  is_featured: boolean;
  created_at: string;
}

interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: string;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
  } | null;
  order_items: {
    id: string;
    quantity: number;
    price: number;
    products: {
      name: string;
      price: number;
      image_url: string;
    } | null;
  }[];
}

interface Stats {
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  totalRevenue: number;
}

const AdminDashboard = () => {
  const { profile, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats>({ totalOrders: 0, totalProducts: 0, totalUsers: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: 0,
    image_url: '',
    category: '',
    is_featured: false
  });

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchAdminData();
    } else if (profile && profile.role !== 'admin') {
      // This will be handled by ProtectedRoute, but adding as safety
      console.warn('Non-admin user attempted to access admin dashboard');
    }
  }, [profile]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      // Step 1: Fetch all tables separately
      const [productsRes, ordersRes, profilesRes, orderItemsRes] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*'),
        supabase.from('order_items').select('*')
      ]);
      
      // Step 2: Check for errors
      if (productsRes.error) {
        console.error('Products error:', productsRes.error);
        throw productsRes.error;
      }
      if (ordersRes.error) {
        console.error('Orders error:', ordersRes.error);
        throw ordersRes.error;
      }
      if (profilesRes.error) {
        console.error('Profiles error:', profilesRes.error);
        throw profilesRes.error;
      }
      if (orderItemsRes.error) {
        console.error('Order items error:', orderItemsRes.error);
        throw orderItemsRes.error;
      }
      
      // Step 3: Log data counts for debugging
      console.log('Products loaded:', productsRes.data?.length || 0);
      console.log('Orders loaded:', ordersRes.data?.length || 0);
      console.log('Profiles loaded:', profilesRes.data?.length || 0);
      console.log('Order items loaded:', orderItemsRes.data?.length || 0);
      
      // Step 4: Manually join data in JavaScript
      const ordersWithDetails = ordersRes.data?.map(order => {
        const userProfile = profilesRes.data?.find(p => p.id === order.user_id);
        const orderItems = orderItemsRes.data?.filter(item => item.order_id === order.id);
        
        const itemsWithProducts = orderItems?.map(item => {
          const product = productsRes.data?.find(p => p.id === item.product_id);
          return {
            ...item,
            products: product ? { 
              name: product.name, 
              price: product.price,
              image_url: product.image_url 
            } : null
          };
        });
        
        return {
          ...order,
          profiles: userProfile ? { 
            full_name: userProfile.full_name, 
            email: userProfile.email 
          } : null,
          order_items: itemsWithProducts || []
        };
      });
      
      // Step 5: Set state with joined data
      setProducts(productsRes.data || []);
      setOrders(ordersWithDetails || []);
      setStats({
        totalOrders: ordersRes.data?.length || 0,
        totalProducts: productsRes.data?.length || 0,
        totalUsers: profilesRes.data?.filter(p => p.role === 'user').length || 0,
        totalRevenue: ordersWithDetails?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
      });
      
    } catch (error: any) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!productForm.name?.trim()) {
      toast.error('Product name is required');
      return;
    }
    
    if (productForm.price <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }
    
    if (!productForm.category?.trim()) {
      toast.error('Category is required');
      return;
    }
    
    try {
      console.log('Submitting product:', productForm);
      
      if (editingProduct) {
        // Update existing product
        const { data, error } = await supabase
          .from('products')
          .update({
            name: productForm.name.trim(),
            description: productForm.description.trim(),
            price: productForm.price,
            image_url: productForm.image_url.trim(),
            category: productForm.category.trim(),
            is_featured: productForm.is_featured
          })
          .eq('id', editingProduct.id)
          .select();
        
        if (error) {
          console.error('Update error:', error);
          throw error;
        }
        
        console.log('Product updated:', data);
        toast.success('Product updated successfully!');
      } else {
        // Create new product
        const { data, error } = await supabase
          .from('products')
          .insert({
            name: productForm.name.trim(),
            description: productForm.description.trim(),
            price: productForm.price,
            image_url: productForm.image_url.trim(),
            category: productForm.category.trim(),
            is_featured: productForm.is_featured
          })
          .select();
        
        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
        
        console.log('Product created:', data);
        toast.success('Product created successfully!');
      }
      
      // Reset form and close modal
      setProductForm({
        name: '',
        description: '',
        price: 0,
        image_url: '',
        category: '',
        is_featured: false
      });
      setEditingProduct(null);
      setShowProductModal(false);
      
      // Refresh data
      fetchAdminData();
      
    } catch (error: any) {
      console.error('Product submission failed:', error);
      toast.error(error.message || 'Failed to save product');
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price,
      image_url: product.image_url,
      category: product.category,
      is_featured: product.is_featured
    });
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }
    
    try {
      console.log('Deleting product:', id);
      
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Delete error:', error);
        throw error;
      }
      
      console.log('Product deleted successfully');
      toast.success('Product deleted successfully!');
      
      // Refresh data
      fetchAdminData();
      
    } catch (error: any) {
      console.error('Delete failed:', error);
      toast.error(error.message || 'Failed to delete product');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      console.log('Updating order status:', orderId, newStatus);
      
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
      
      if (error) {
        console.error('Status update error:', error);
        throw error;
      }
      
      console.log('Order status updated successfully');
      toast.success('Order status updated!');
      
      // Refresh data
      fetchAdminData();
      
    } catch (error: any) {
      console.error('Status update failed:', error);
      toast.error(error.message || 'Failed to update order status');
    }
  };

  const closeModal = () => {
    setShowProductModal(false);
    setEditingProduct(null);
    setProductForm({
      name: '',
      description: '',
      price: 0,
      image_url: '',
      category: '',
      is_featured: false
    });
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile || profile.role !== 'admin') {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome back, {profile.full_name}!</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-primary-600">{stats.totalOrders}</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-primary-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-secondary-600">{stats.totalProducts}</p>
              </div>
              <Package className="w-8 h-8 text-secondary-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-accent-600">{stats.totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-accent-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">${stats.totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('products')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'products'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Products
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'orders'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Orders
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'products' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Products</h2>
                  <button
                    onClick={() => setShowProductModal(true)}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Product
                  </button>
                </div>
                
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading products...</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                      <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-40 object-cover rounded-lg mb-4"
                        />
                        <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                        <p className="text-gray-600 text-sm mb-2">{product.description}</p>
                        <p className="text-primary-600 font-bold text-lg mb-2">${product.price.toFixed(2)}</p>
                        <p className="text-sm text-gray-500 mb-4">Category: {product.category}</p>
                        
                        <div className="flex justify-between items-center">
                          <span className={`px-2 py-1 rounded text-xs ${
                            product.is_featured ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {product.is_featured ? 'Featured' : 'Regular'}
                          </span>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'orders' && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-6">Orders</h2>
                
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading orders...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">Order #{order.id.slice(-8)}</h3>
                            <p className="text-gray-600">
                              Customer: {order.profiles?.full_name || 'Unknown'} ({order.profiles?.email || 'No email'})
                            </p>
                            <p className="text-gray-600">
                              Date: {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-primary-600">${order.total_amount.toFixed(2)}</p>
                            <select
                              value={order.status}
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                              className="mt-2 px-3 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                              <option value="pending">Pending</option>
                              <option value="preparing">Preparing</option>
                              <option value="ready">Ready</option>
                              <option value="delivered">Delivered</option>
                            </select>
                          </div>
                        </div>
                        
                        <div className="border-t pt-4">
                          <h4 className="font-medium mb-2">Items:</h4>
                          <div className="space-y-2">
                            {order.order_items.map((item) => (
                              <div key={item.id} className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <img
                                    src={item.products?.image_url || '/placeholder.jpg'}
                                    alt={item.products?.name || 'Unknown'}
                                    className="w-10 h-10 object-cover rounded"
                                  />
                                  <span>{item.products?.name || 'Unknown Product'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">
                                    {item.quantity} × ${item.price.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  value={productForm.image_url}
                  onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">Select Category</option>
                  <option value="pizza">Pizza</option>
                  <option value="appetizer">Appetizer</option>
                  <option value="salad">Salad</option>
                  <option value="dessert">Dessert</option>
                  <option value="drink">Drink</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_featured"
                  checked={productForm.is_featured}
                  onChange={(e) => setProductForm({ ...productForm, is_featured: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="is_featured" className="text-sm font-medium text-gray-700">
                  Featured Product
                </label>
              </div>
              
              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;