import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface CartItem {
  id: string;
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: any) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartTotal: () => number;
  checkout: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchCartItems();
    } else {
      setCartItems([]);
    }
  }, [user]);

  const fetchCartItems = async () => {
    if (!user) return;
    
    try {
      console.log('Fetching cart items for user:', user.id);
      
      // Fetch cart items and products separately
      const [cartItemsRes, productsRes] = await Promise.all([
        supabase
          .from('cart_items')
          .select('*')
          .eq('user_id', user.id),
        supabase.from('products').select('*')
      ]);
      
      if (cartItemsRes.error) {
        console.error('Cart items fetch error:', cartItemsRes.error);
        throw cartItemsRes.error;
      }
      
      if (productsRes.error) {
        console.error('Products fetch error:', productsRes.error);
        throw productsRes.error;
      }
      
      // Manually join cart items with products
      const cartWithProducts = cartItemsRes.data?.map(item => {
        const product = productsRes.data?.find(p => p.id === item.product_id);
        return {
          id: item.id,
          product_id: item.product_id,
          name: product?.name || 'Unknown Product',
          price: product?.price || 0,
          quantity: item.quantity,
          image_url: product?.image_url || ''
        };
      }) || [];
      
      console.log('Cart items loaded:', cartWithProducts.length);
      setCartItems(cartWithProducts);
    } catch (error: any) {
      console.error('Error fetching cart items:', error);
      toast.error('Failed to load cart items');
    }
  };

  const addToCart = async (product: any) => {
    if (!user) {
      toast.error('Please login to add items to cart');
      return;
    }
    
    try {
      console.log('Adding to cart:', product.id);
      
      // Check if item already in cart
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', product.id)
        .single();
      
      if (existingItem) {
        // Update quantity
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + 1 })
          .eq('id', existingItem.id);
        
        if (error) {
          console.error('Update quantity error:', error);
          throw error;
        }
        
        console.log('Cart item quantity updated');
      } else {
        // Add new item
        const { error } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            product_id: product.id,
            quantity: 1
          });
        
        if (error) {
          console.error('Add to cart error:', error);
          throw error;
        }
        
        console.log('New item added to cart');
      }
      
      // Refresh cart
      await fetchCartItems();
      
    } catch (error: any) {
      console.error('Add to cart failed:', error);
      toast.error('Failed to add item to cart');
    }
  };

  const removeFromCart = async (productId: string) => {
    if (!user) return;
    
    try {
      console.log('Removing from cart:', productId);
      
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);
      
      if (error) {
        console.error('Remove from cart error:', error);
        throw error;
      }
      
      console.log('Item removed from cart');
      
      // Refresh cart
      await fetchCartItems();
      
    } catch (error: any) {
      console.error('Remove from cart failed:', error);
      toast.error('Failed to remove item from cart');
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!user) return;
    
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }
    
    try {
      console.log('Updating quantity:', productId, quantity);
      
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('user_id', user.id)
        .eq('product_id', productId);
      
      if (error) {
        console.error('Update quantity error:', error);
        throw error;
      }
      
      console.log('Cart item quantity updated');
      
      // Refresh cart
      await fetchCartItems();
      
    } catch (error: any) {
      console.error('Update quantity failed:', error);
      toast.error('Failed to update quantity');
    }
  };

  const clearCart = async () => {
    if (!user) return;
    
    try {
      console.log('Clearing cart for user:', user.id);
      
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Clear cart error:', error);
        throw error;
      }
      
      console.log('Cart cleared');
      setCartItems([]);
      
    } catch (error: any) {
      console.error('Clear cart failed:', error);
      toast.error('Failed to clear cart');
    }
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const checkout = async () => {
    if (!user || cartItems.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    
    try {
      console.log('Processing checkout for user:', user.id);
      
      const totalAmount = getCartTotal();
      
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: totalAmount,
          status: 'pending'
        })
        .select()
        .single();
      
      if (orderError) {
        console.error('Order creation error:', orderError);
        throw orderError;
      }
      
      console.log('Order created:', order.id);
      
      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price
      }));
      
      const { error: orderItemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
      
      if (orderItemsError) {
        console.error('Order items creation error:', orderItemsError);
        throw orderItemsError;
      }
      
      console.log('Order items created');
      
      // Clear cart
      await clearCart();
      
      toast.success('Order placed successfully!');
      
    } catch (error: any) {
      console.error('Checkout failed:', error);
      toast.error('Failed to process checkout');
    }
  };

  const value: CartContextType = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    checkout
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};