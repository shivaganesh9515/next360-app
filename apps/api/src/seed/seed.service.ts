import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService {
  private readonly logger = new Logger('SeedService');

  constructor(private readonly prisma: PrismaService) {}

  async seed() {
    this.logger.log('Starting database seed...');

    // Check if data already exists
    const userCount = await this.prisma.user.count();
    if (userCount > 0) {
      this.logger.warn('Database already has data. Skipping seed.');
      return { message: 'Database already seeded', skipped: true };
    }

    try {
      // 1. Create Users
      this.logger.log('Creating users...');
      const hashedPassword = await bcrypt.hash('password123', 10);

      const admin = await this.prisma.user.create({
        data: {
          email: 'admin@next360.com',
          password: hashedPassword,
          name: 'Admin User',
          phone: '+919876543210',
          role: 'ADMIN',
        },
      });

      const vendorUsers = await Promise.all([
        this.prisma.user.create({
          data: {
            email: 'organic@next360.com',
            password: hashedPassword,
            name: 'Green Earth Organics',
            phone: '+919876543211',
            role: 'VENDOR',
          },
        }),
        this.prisma.user.create({
          data: {
            email: 'natural@next360.com',
            password: hashedPassword,
            name: 'Pure Natural Living',
            phone: '+919876543212',
            role: 'VENDOR',
          },
        }),
        this.prisma.user.create({
          data: {
            email: 'eco@next360.com',
            password: hashedPassword,
            name: 'Eco Harmony Store',
            phone: '+919876543213',
            role: 'VENDOR',
          },
        }),
      ]);

      const customerUsers = await Promise.all([
        this.prisma.user.create({
          data: {
            email: 'customer1@next360.com',
            password: hashedPassword,
            name: 'Rahul Sharma',
            phone: '+919876543214',
            role: 'CUSTOMER',
          },
        }),
        this.prisma.user.create({
          data: {
            email: 'customer2@next360.com',
            password: hashedPassword,
            name: 'Priya Patel',
            phone: '+919876543215',
            role: 'CUSTOMER',
          },
        }),
        this.prisma.user.create({
          data: {
            email: 'customer3@next360.com',
            password: hashedPassword,
            name: 'Amit Kumar',
            phone: '+919876543216',
            role: 'CUSTOMER',
          },
        }),
        this.prisma.user.create({
          data: {
            email: 'customer4@next360.com',
            password: hashedPassword,
            name: 'Sneha Reddy',
            phone: '+919876543217',
            role: 'CUSTOMER',
          },
        }),
      ]);

      const deliveryUsers = await Promise.all([
        this.prisma.user.create({
          data: {
            email: 'delivery1@next360.com',
            password: hashedPassword,
            name: 'Rajesh Delivery',
            phone: '+919876543218',
            role: 'DELIVERY_PARTNER',
          },
        }),
        this.prisma.user.create({
          data: {
            email: 'delivery2@next360.com',
            password: hashedPassword,
            name: 'Suresh Delivery',
            phone: '+919876543219',
            role: 'DELIVERY_PARTNER',
          },
        }),
      ]);

      // 2. Create Categories
      this.logger.log('Creating categories...');
      const organicCategories = await Promise.all([
        this.prisma.category.create({
          data: { name: 'Fresh Fruits', slug: 'fresh-fruits', storeType: 'ORGANIC', description: 'Certified organic fresh fruits' },
        }),
        this.prisma.category.create({
          data: { name: 'Vegetables', slug: 'vegetables', storeType: 'ORGANIC', description: 'Farm-fresh organic vegetables' },
        }),
        this.prisma.category.create({
          data: { name: 'Grains & Cereals', slug: 'grains', storeType: 'ORGANIC', description: 'Organic grains and cereals' },
        }),
        this.prisma.category.create({
          data: { name: 'Dairy & Eggs', slug: 'dairy', storeType: 'ORGANIC', description: 'Organic dairy products' },
        }),
      ]);

      const naturalCategories = await Promise.all([
        this.prisma.category.create({
          data: { name: 'Skincare', slug: 'skincare', storeType: 'NATURAL', description: 'Natural skincare products' },
        }),
        this.prisma.category.create({
          data: { name: 'Haircare', slug: 'haircare', storeType: 'NATURAL', description: 'Natural haircare solutions' },
        }),
        this.prisma.category.create({
          data: { name: 'Wellness', slug: 'wellness', storeType: 'NATURAL', description: 'Natural wellness products' },
        }),
        this.prisma.category.create({
          data: { name: 'Home & Living', slug: 'home-living', storeType: 'NATURAL', description: 'Natural home products' },
        }),
      ]);

      const ecoCategories = await Promise.all([
        this.prisma.category.create({
          data: { name: 'Kitchen', slug: 'kitchen', storeType: 'ECO_FRIENDLY', description: 'Eco-friendly kitchen essentials' },
        }),
        this.prisma.category.create({
          data: { name: 'Cleaning', slug: 'cleaning', storeType: 'ECO_FRIENDLY', description: 'Eco-friendly cleaning products' },
        }),
        this.prisma.category.create({
          data: { name: 'Accessories', slug: 'accessories', storeType: 'ECO_FRIENDLY', description: 'Sustainable accessories' },
        }),
        this.prisma.category.create({
          data: { name: 'Clothing', slug: 'clothing', storeType: 'ECO_FRIENDLY', description: 'Eco-friendly clothing' },
        }),
      ]);

      // 3. Create Vendors
      this.logger.log('Creating vendors...');
      const vendors = await Promise.all([
        this.prisma.vendor.create({
          data: {
            userId: vendorUsers[0].id,
            businessName: 'Green Earth Organics',
            storeType: 'ORGANIC',
            commissionRate: 15,
            status: 'APPROVED',
            description: 'Certified organic products from local farms',
          },
        }),
        this.prisma.vendor.create({
          data: {
            userId: vendorUsers[1].id,
            businessName: 'Pure Natural Living',
            storeType: 'NATURAL',
            commissionRate: 15,
            status: 'APPROVED',
            description: 'Natural and Ayurvedic products for healthy living',
          },
        }),
        this.prisma.vendor.create({
          data: {
            userId: vendorUsers[2].id,
            businessName: 'Eco Harmony Store',
            storeType: 'ECO_FRIENDLY',
            commissionRate: 15,
            status: 'APPROVED',
            description: 'Sustainable and eco-friendly everyday products',
          },
        }),
      ]);

      // 4. Create Products
      this.logger.log('Creating products...');
      const organicProducts = [
        { name: 'Organic Apples (1kg)', slug: 'organic-apples', price: 250, description: 'Fresh organic apples from Himachal Pradesh', categoryId: organicCategories[0].id },
        { name: 'Organic Bananas (1 dozen)', slug: 'organic-bananas', price: 120, description: 'Sweet organic bananas', categoryId: organicCategories[0].id },
        { name: 'Spinach (500g)', slug: 'spinach', price: 60, description: 'Fresh organic spinach', categoryId: organicCategories[1].id },
        { name: 'Tomatoes (1kg)', slug: 'tomatoes', price: 80, description: 'Juicy organic tomatoes', categoryId: organicCategories[1].id },
        { name: 'Brown Rice (2kg)', slug: 'brown-rice', price: 180, description: 'Organic brown rice', categoryId: organicCategories[2].id },
        { name: 'Oats (1kg)', slug: 'oats', price: 150, description: 'Organic rolled oats', categoryId: organicCategories[2].id },
        { name: 'Organic Milk (1L)', slug: 'organic-milk', price: 85, description: 'Fresh organic milk', categoryId: organicCategories[3].id },
        { name: 'Free Range Eggs (12)', slug: 'eggs', price: 120, description: 'Free range organic eggs', categoryId: organicCategories[3].id },
      ];

      const naturalProducts = [
        { name: 'Aloe Vera Gel (200ml)', slug: 'aloe-vera-gel', price: 250, description: 'Pure aloe vera gel for skin', categoryId: naturalCategories[0].id },
        { name: 'Neem Face Wash (150ml)', slug: 'neem-face-wash', price: 180, description: 'Natural neem face wash', categoryId: naturalCategories[0].id },
        { name: 'Coconut Hair Oil (200ml)', slug: 'coconut-hair-oil', price: 220, description: 'Cold-pressed coconut oil for hair', categoryId: naturalCategories[1].id },
        { name: 'Shikakai Shampoo (250ml)', slug: 'shikakai-shampoo', price: 190, description: 'Natural shikakai shampoo', categoryId: naturalCategories[1].id },
        { name: 'Ashwagandha Capsules (60)', slug: 'ashwagandha', price: 350, description: 'Organic ashwagandha supplements', categoryId: naturalCategories[2].id },
        { name: 'Tulsi Drops (30ml)', slug: 'tulsi-drops', price: 120, description: 'Holy basil extract drops', categoryId: naturalCategories[2].id },
        { name: 'Camphor Tablets (100g)', slug: 'camphor', price: 80, description: 'Natural camphor for home', categoryId: naturalCategories[3].id },
        { name: 'Essential Oil Set (6 x 10ml)', slug: 'essential-oils', price: 550, description: 'Lavender, eucalyptus, tea tree oils', categoryId: naturalCategories[3].id },
      ];

      const ecoProducts = [
        { name: 'Steel Lunch Box', slug: 'steel-lunch-box', price: 450, description: 'Stainless steel reusable lunch box', categoryId: ecoCategories[0].id },
        { name: 'Bamboo Cutlery Set', slug: 'bamboo-cutlery', price: 350, description: 'Portable bamboo cutlery set', categoryId: ecoCategories[0].id },
        { name: 'Natural Dish Soap (500ml)', slug: 'dish-soap', price: 180, description: 'Eco-friendly dish soap', categoryId: ecoCategories[1].id },
        { name: 'Coconut Fiber Brush', slug: 'coconut-brush', price: 120, description: 'Natural coconut fiber cleaning brush', categoryId: ecoCategories[1].id },
        { name: 'Jute Tote Bag', slug: 'jute-bag', price: 250, description: 'Reusable jute shopping bag', categoryId: ecoCategories[2].id },
        { name: 'Bamboo Sunglasses', slug: 'bamboo-sunglasses', price: 800, description: 'Sustainable bamboo frame sunglasses', categoryId: ecoCategories[2].id },
        { name: 'Organic Cotton T-Shirt', slug: 'cotton-tshirt', price: 600, description: 'Eco-friendly cotton t-shirt', categoryId: ecoCategories[3].id },
        { name: 'Hemp Backpack', slug: 'hemp-backpack', price: 1200, description: 'Durable hemp fiber backpack', categoryId: ecoCategories[3].id },
      ];

      const createProducts = async (products: any[], vendorId: string) => {
        return Promise.all(
          products.map((p) =>
            this.prisma.product.create({
              data: {
                ...p,
                vendorId,
                isApproved: true,
                isActive: true,
                stock: Math.floor(Math.random() * 50) + 10,
              },
            })
          )
        );
      };

      const allOrganicProducts = await createProducts(organicProducts, vendors[0].id);
      const allNaturalProducts = await createProducts(naturalProducts, vendors[1].id);
      const allEcoProducts = await createProducts(ecoProducts, vendors[2].id);
      const allProducts = [...allOrganicProducts, ...allNaturalProducts, ...allEcoProducts];

      // 5. Create Addresses
      this.logger.log('Creating addresses...');
      const addresses = await Promise.all([
        this.prisma.address.create({
          data: {
            userId: customerUsers[0].id,
            label: 'Home',
            street: '123 MG Road',
            city: 'Hyderabad',
            state: 'Telangana',
            pincode: '500001',
            country: 'India',
            isDefault: true,
          },
        }),
        this.prisma.address.create({
          data: {
            userId: customerUsers[1].id,
            label: 'Office',
            street: '456 Banjara Hills',
            city: 'Hyderabad',
            state: 'Telangana',
            pincode: '500034',
            country: 'India',
            isDefault: true,
          },
        }),
      ]);

      // 6. Create Orders
      this.logger.log('Creating orders...');
      await Promise.all([
        this.prisma.order.create({
          data: {
            userId: customerUsers[0].id,
            addressId: addresses[0].id,
            status: 'DELIVERED',
            total: 450,
            paymentMethod: 'UPI',
            paymentStatus: 'PAID',
            items: {
              create: [
                { productId: allOrganicProducts[0].id, quantity: 1, price: 250 },
                { productId: allOrganicProducts[4].id, quantity: 1, price: 180 },
              ],
            },
          },
        }),
        this.prisma.order.create({
          data: {
            userId: customerUsers[1].id,
            addressId: addresses[1].id,
            status: 'OUT_FOR_DELIVERY',
            total: 620,
            paymentMethod: 'COD',
            paymentStatus: 'PENDING',
            items: {
              create: [
                { productId: allNaturalProducts[0].id, quantity: 2, price: 500 },
                { productId: allNaturalProducts[4].id, quantity: 1, price: 350 },
              ],
            },
          },
        }),
        this.prisma.order.create({
          data: {
            userId: customerUsers[2].id,
            addressId: addresses[0].id,
            status: 'CONFIRMED',
            total: 350,
            paymentMethod: 'UPI',
            paymentStatus: 'PAID',
            items: {
              create: [
                { productId: allEcoProducts[0].id, quantity: 1, price: 450 },
              ],
            },
          },
        }),
        this.prisma.order.create({
          data: {
            userId: customerUsers[3].id,
            addressId: addresses[1].id,
            status: 'PENDING',
            total: 280,
            paymentMethod: 'CARD',
            paymentStatus: 'PENDING',
            items: {
              create: [
                { productId: allOrganicProducts[2].id, quantity: 2, price: 120 },
                { productId: allOrganicProducts[6].id, quantity: 1, price: 85 },
              ],
            },
          },
        }),
        this.prisma.order.create({
          data: {
            userId: customerUsers[0].id,
            addressId: addresses[0].id,
            status: 'DELIVERED',
            total: 900,
            paymentMethod: 'UPI',
            paymentStatus: 'PAID',
            items: {
              create: [
                { productId: allEcoProducts[4].id, quantity: 1, price: 250 },
                { productId: allEcoProducts[7].id, quantity: 1, price: 1200 },
              ],
            },
          },
        }),
      ]);

      this.logger.log('Seed completed successfully!');
      return {
        message: 'Database seeded successfully',
        counts: {
          users: 10,
          vendors: 3,
          categories: 12,
          products: 24,
          orders: 5,
        },
      };
    } catch (error) {
      this.logger.error('Seed failed:', error);
      throw error;
    }
  }

  async reset() {
    this.logger.log('Resetting database...');

    // Delete in reverse order of dependencies
    await this.prisma.orderItem.deleteMany();
    await this.prisma.order.deleteMany();
    await this.prisma.cartItem.deleteMany();
    await this.prisma.wishlistItem.deleteMany();
    await this.prisma.review.deleteMany();
    await this.prisma.product.deleteMany();
    await this.prisma.category.deleteMany();
    await this.prisma.vendor.deleteMany();
    await this.prisma.address.deleteMany();
    await this.prisma.notification.deleteMany();
    await this.prisma.user.deleteMany();

    this.logger.log('Database reset complete');
    return { message: 'Database reset successfully' };
  }

  async getStatus() {
    const counts = {
      users: await this.prisma.user.count(),
      vendors: await this.prisma.vendor.count(),
      categories: await this.prisma.category.count(),
      products: await this.prisma.product.count(),
      orders: await this.prisma.order.count(),
    };

    return {
      seeded: counts.users > 0,
      counts,
    };
  }
}
