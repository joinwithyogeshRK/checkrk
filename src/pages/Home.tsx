import React, { useState, useEffect } from 'react';
import { Star, ShoppingCart, Users, Award, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  is_featured: boolean;
}

interface Testimonial {
  id: string;
  customer_name: string;
  content: string;
  rating: number;
  created_at: string;
}

const Home = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { addToCart } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [productsRes, testimonialsRes] = await Promise.all([
          supabase.from('products').select('*').eq('is_featured', true).limit(8),
          supabase.from('testimonials').select('*').order('created_at', { ascending: false }).limit(6)
        ]);
        
        if (productsRes.error) {
          console.error('Products fetch error:', productsRes.error);
          throw productsRes.error;
        }
        if (testimonialsRes.error) {
          console.error('Testimonials fetch error:', testimonialsRes.error);
          throw testimonialsRes.error;
        }
        
        console.log('Products loaded:', productsRes.data?.length || 0);
        console.log('Testimonials loaded:', testimonialsRes.data?.length || 0);
        
        setProducts(productsRes.data || []);
        setTestimonials(testimonialsRes.data || []);
      } catch (error: any) {
        console.error('Error fetching data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAddToCart = async (product: Product) => {
    if (!user) {
      toast.error('Please login to add items to cart');
      return;
    }
    
    try {
      await addToCart(product);
      toast.success(`${product.name} added to cart!`);
    } catch (error) {
      toast.error('Failed to add item to cart');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        <p>Error loading data: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-accent-200 bg-clip-text text-transparent">
            Nonna's Pizzeria
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Authentic Italian Pizza Made with Love & Tradition
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => scrollToSection('menu')}
              className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              View Menu
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors"
            >
              Our Story
            </button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-800 mb-8">Our Story</h2>
            <p className="text-lg text-gray-600 mb-8">
              For over 30 years, Nonna's Pizzeria has been serving authentic Italian pizza 
              made with traditional recipes passed down through generations. Every pizza is 
              hand-crafted with the finest ingredients and baked in our wood-fired oven.
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">30+ Years</h3>
                <p className="text-gray-600">of authentic Italian tradition</p>
              </div>
              <div className="text-center">
                <div className="bg-secondary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-secondary-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Family Owned</h3>
                <p className="text-gray-600">Recipes passed down generations</p>
              </div>
              <div className="text-center">
                <div className="bg-accent-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-accent-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Fresh Daily</h3>
                <p className="text-gray-600">Made fresh every morning</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Menu */}
      <section id="menu" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">
            Our Featured Pizzas
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="aspect-w-16 aspect-h-12 bg-gray-200">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
                  <p className="text-gray-600 mb-4 text-sm">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary-600">
                      ${product.price.toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">
            What Our Customers Say
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="bg-gray-50 rounded-lg p-6 shadow-md">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < testimonial.rating ? 'text-accent-500 fill-current' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.content}"</p>
                <p className="font-semibold text-gray-800">{testimonial.customer_name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-primary-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-8">Visit Us Today</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-semibold mb-4">Location</h3>
                <p className="text-lg opacity-90 mb-2">123 MG Road</p>
                <p className="text-lg opacity-90 mb-2">Bangalore, India 560001</p>
                <p className="text-lg opacity-90">(555) 123-PIZZA</p>
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-4">Hours</h3>
                <p className="text-lg opacity-90 mb-2">Monday - Thursday: 11am - 10pm</p>
                <p className="text-lg opacity-90 mb-2">Friday - Saturday: 11am - 11pm</p>
                <p className="text-lg opacity-90">Sunday: 12pm - 9pm</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;