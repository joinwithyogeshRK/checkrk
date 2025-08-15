-- Create admin user in auth.users table
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'admin123@gmail.com',
  crypt('admin1234', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Create admin profile
INSERT INTO profiles (id, email, role, full_name) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'admin123@gmail.com', 'admin', 'Admin User')
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- Insert sample products
INSERT INTO products (id, name, description, price, image_url, category, is_featured) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Margherita Pizza', 'Classic pizza with fresh tomatoes, mozzarella, and basil', 16.99, 'https://images.unsplash.com/photo-1604382354936-07c5b6f67692?w=500&h=400&fit=crop', 'pizza', true),
  ('22222222-2222-2222-2222-222222222222', 'Pepperoni Pizza', 'Traditional pepperoni with mozzarella cheese', 18.99, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=500&h=400&fit=crop', 'pizza', true),
  ('33333333-3333-3333-3333-333333333333', 'Quattro Stagioni', 'Four seasons pizza with artichokes, ham, mushrooms, and olives', 22.99, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&h=400&fit=crop', 'pizza', true),
  ('44444444-4444-4444-4444-444444444444', 'Meat Lovers', 'Loaded with pepperoni, sausage, bacon, and ham', 24.99, 'https://images.unsplash.com/photo-1590534247678-0ee1c86c7a8e?w=500&h=400&fit=crop', 'pizza', true),
  ('55555555-5555-5555-5555-555555555555', 'Vegetarian Supreme', 'Bell peppers, mushrooms, onions, olives, and tomatoes', 19.99, 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=500&h=400&fit=crop', 'pizza', true),
  ('66666666-6666-6666-6666-666666666666', 'Hawaiian Paradise', 'Ham and pineapple with mozzarella cheese', 17.99, 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=500&h=400&fit=crop', 'pizza', true),
  ('77777777-7777-7777-7777-777777777777', 'BBQ Chicken', 'Grilled chicken with BBQ sauce and red onions', 21.99, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&h=400&fit=crop', 'pizza', true),
  ('88888888-8888-8888-8888-888888888888', 'White Pizza', 'Ricotta, mozzarella, and parmesan with garlic', 20.99, 'https://images.unsplash.com/photo-1595708684082-a173bb3a06c5?w=500&h=400&fit=crop', 'pizza', true),
  ('99999999-9999-9999-9999-999999999999', 'Garlic Bread', 'Crispy bread with garlic butter and herbs', 8.99, 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?w=500&h=400&fit=crop', 'appetizer', false),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Caesar Salad', 'Romaine lettuce with caesar dressing and croutons', 12.99, 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=500&h=400&fit=crop', 'salad', false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Tiramisu', 'Classic Italian dessert with coffee and mascarpone', 7.99, 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500&h=400&fit=crop', 'dessert', false),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Italian Soda', 'Sparkling water with natural fruit flavors', 3.99, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&h=400&fit=crop', 'drink', false)
ON CONFLICT (id) DO NOTHING;

-- Insert sample testimonials
INSERT INTO testimonials (id, customer_name, content, rating) VALUES 
  ('t1111111-1111-1111-1111-111111111111', 'Maria Rodriguez', 'The best pizza in town! The dough is perfect and the ingredients are so fresh. I''ve been coming here for years and it never disappoints.', 5),
  ('t2222222-2222-2222-2222-222222222222', 'John Smith', 'Nonna''s has the most authentic Italian pizza I''ve ever tasted. The margherita is absolutely divine!', 5),
  ('t3333333-3333-3333-3333-333333333333', 'Sarah Johnson', 'Great family atmosphere and incredible food. The staff is always friendly and the pizza arrives hot and delicious.', 5),
  ('t4444444-4444-4444-4444-444444444444', 'Michael Brown', 'I love the variety of toppings and the wood-fired oven gives the pizza such a unique flavor. Highly recommend!', 4),
  ('t5555555-5555-5555-5555-555555555555', 'Lisa Wilson', 'The vegetarian options are amazing! As someone who doesn''t eat meat, I appreciate the creativity in their veggie pizzas.', 5),
  ('t6666666-6666-6666-6666-666666666666', 'David Martinez', 'Fast delivery and the pizza was still hot when it arrived. The pepperoni pizza is my favorite - perfectly spiced!', 4)
ON CONFLICT (id) DO NOTHING;