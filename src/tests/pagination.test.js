const request = require('supertest');
const app = require('../app');
const { sequelize, User, Category, Item } = require('../models');

describe('Pagination Tests', () => {
  // Setup test environment before all tests
  beforeAll(async () => {
    try {
      console.log("Starting test setup...");
      
      // Sync database
      console.log("Syncing database...");
      await sequelize.sync({ force: true });
      console.log("Database synced successfully");
      
      // Create test user with hashed password
      console.log("Creating test user...");
      const testUser = {
        email: 'test@example.com',
        password: '$2b$10$abcdefghijklmnopqrstuv', // Pre-hashed dummy password
        first_name: 'Test',
        last_name: 'User',
        phone_number: '1234567890',
        zip_code: '10001'
      };
      
      await User.create(testUser);
      console.log("Test user created");
      
      // Create categories
      console.log("Creating test categories...");
      const categories = ['furniture', 'electronics', 'clothing', 'books'];
      await Promise.all(categories.map(cat => 
        Category.create({ category_name: cat })
      ));
      console.log("Categories created");
      
      // Create test items directly in the database
      console.log("Creating test items directly in database...");
      const items = [];
      for (let i = 1; i <= 30; i++) {
        const categoryIndex = i % categories.length;
        const title = i % 5 === 0 ? `Special Test Item ${i}` : `Test Item ${i}`;
        
        items.push({
          user_email: testUser.email,
          title: title,
          description: `Description for item ${i}`,
          category_name: categories[categoryIndex],
          item_status: 'available',
          zip: '10001'
        });
      }
      
      await Item.bulkCreate(items);
      console.log("30 test items created directly in database");
      
    } catch (error) {
      console.error("Error in test setup:", error);
      throw error;
    }
  }, 30000); 
  
  // Basic pagination tests
  describe('Basic pagination', () => {
    test('Default pagination should return 12 items', async () => {
      const response = await request(app)
        .get('/api/v1/items');
      
      expect(response.status).toBe(200);
      expect(response.body.items.length).toBe(12);
      expect(response.body.pagination.items_per_page).toBe(12);
      expect(response.body.pagination.current_page).toBe(1);
      expect(response.body.pagination.total_items).toBe(30);
      expect(response.body.pagination.total_pages).toBe(3);
      expect(response.body.pagination.has_next_page).toBe(true);
      expect(response.body.pagination.has_prev_page).toBe(false);
    });
    
    test('Custom limit should be respected', async () => {
      const response = await request(app)
        .get('/api/v1/items?limit=5');
      
      expect(response.status).toBe(200);
      expect(response.body.items.length).toBe(5);
      expect(response.body.pagination.items_per_page).toBe(5);
      expect(response.body.pagination.total_pages).toBe(6);
    });
    
    test('Custom offset should be respected', async () => {
      const response = await request(app)
        .get('/api/v1/items?offset=12');
      
      expect(response.status).toBe(200);
      expect(response.body.pagination.current_page).toBe(2);
    });
    
    test('Combined limit and offset should work correctly', async () => {
      const response = await request(app)
        .get('/api/v1/items?limit=5&offset=15');
      
      expect(response.status).toBe(200);
      expect(response.body.items.length).toBe(5);
      expect(response.body.pagination.current_page).toBe(4);
    });
  });
  
  // Tests for invalid parameters
  describe('Invalid parameters', () => {
    test('Invalid limit should use default value', async () => {
      const response = await request(app)
        .get('/api/v1/items?limit=invalid');
      
      expect(response.status).toBe(200);
      expect(response.body.pagination.items_per_page).toBe(12);
    });
    
    test('Negative limit should use default value', async () => {
      const response = await request(app)
        .get('/api/v1/items?limit=-5');
      
      expect(response.status).toBe(200);
      expect(response.body.pagination.items_per_page).toBe(12);
    });
    
    test('Negative offset should use default value', async () => {
      const response = await request(app)
        .get('/api/v1/items?offset=-10');
      
      expect(response.status).toBe(200);
      expect(response.body.pagination.current_page).toBe(1);
    });
    
    test('Too large limit should be capped at 100', async () => {
      const response = await request(app)
        .get('/api/v1/items?limit=500');
      
      expect(response.status).toBe(200);
      expect(response.body.pagination.items_per_page).toBeLessThanOrEqual(100);
    });
  });
  
  // Tests for pagination with filters
  describe('Pagination with filters', () => {
    test('Pagination with category filter', async () => {
      const response = await request(app)
        .get('/api/v1/items?category=furniture&limit=5');
      
      expect(response.status).toBe(200);
      expect(response.body.items.length).toBeLessThanOrEqual(5);
      expect(response.body.items.every(item => item.category_name === 'furniture')).toBe(true);
    });
    
    test('Pagination with search filter', async () => {
      const response = await request(app)
        .get('/api/v1/items?search=special&limit=5');
      
      expect(response.status).toBe(200);
      expect(response.body.items.every(item => 
        item.title.toLowerCase().includes('special') || 
        item.description.toLowerCase().includes('special')
      )).toBe(true);
    });
    
    test('Pagination with combined filters', async () => {
      // Assuming we have "special" items in the "electronics" category
      const response = await request(app)
        .get('/api/v1/items?category=electronics&search=special&limit=5');
      
      expect(response.status).toBe(200);
      
      if (response.body.items.length > 0) {
        expect(response.body.items.every(item => 
          item.category_name === 'electronics' && 
          (item.title.toLowerCase().includes('special') || 
           item.description.toLowerCase().includes('special'))
        )).toBe(true);
      }
    });
  });  
 
  afterAll(async () => {
    await sequelize.close();
  });
});