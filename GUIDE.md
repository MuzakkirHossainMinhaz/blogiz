# 🧪 Blogiz Testing Guide

Complete step-by-step guide to test all features of the AI-powered multi-user blog platform. This guide covers everything from basic setup to advanced AI features.

## 📋 Table of Contents

1. [Prerequisites & Setup](#prerequisites--setup)
2. [Basic Functionality Testing](#basic-functionality-testing)
3. [User Management Testing](#user-management-testing)
4. [Blog System Testing](#blog-system-testing)
5. [Comment System Testing](#comment-system-testing)
6. [AI Features Testing](#ai-features-testing)
7. [Admin Features Testing](#admin-features-testing)
8. [Banner Management Testing](#banner-management-testing)
9. [Advanced Features Testing](#advanced-features-testing)
10. [Performance & Security Testing](#performance--security-testing)
11. [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites & Setup

### Before You Start

Ensure you have completed the setup from README.md:

- ✅ Node.js 18+ installed
- ✅ MongoDB running (local or Atlas)
- ✅ Environment variables configured
- ✅ Development server running (`npm run dev`)
- ✅ HuggingFace API key configured

### Step 1: Create Superadmin Account

```bash
curl -X POST http://localhost:3000/api/seed \
  -H "Content-Type: application/json" \
  -d '{"email": "superadmin@blogiz.com", "password": "superadmin123"}'
```

**Expected Response:**

```json
{
  "message": "Superadmin user created successfully",
  "user": {
    "email": "superadmin@blogiz.com",
    "role": "superadmin"
  },
  "stats": {
    "totalUsers": 1,
    "totalBlogs": 0,
    "totalComments": 0
  }
}
```

### Step 2: Verify Database Connection

Check your MongoDB to ensure:

- ✅ `users` collection exists with superadmin user
- ✅ Database connection is working
- ✅ Environment variables are correctly loaded

## 🧪 Basic Functionality Testing

### Test 1: Server Health Check

```bash
curl http://localhost:3000/api/health
```

### Test 2: Environment Validation

Visit `http://localhost:3000` in your browser and check the console for environment configuration logs.

## 👥 User Management Testing

### Test 1: User Registration

#### Register as Regular User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "testuser",
    "email": "testuser@example.com",
    "password": "password123",
    "fullName": "Test User",
    "role": "user"
  }'
```

**Expected Response:**

```json
{
  "message": "User created successfully",
  "user": {
    "id": "...",
    "name": "testuser",
    "email": "testuser@example.com",
    "role": "user",
    "profile": {
      "fullName": "Test User",
      "bio": ""
    },
    "isApproved": true
  }
}
```

#### Register as Author (Requires Approval)

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "testauthor",
    "email": "author@example.com",
    "password": "password123",
    "fullName": "Test Author",
    "role": "author"
  }'
```

**Expected Response:**

```json
{
  "message": "Registration successful! Your account is pending approval from an admin.",
  "user": {
    "role": "author",
    "isApproved": false
  }
}
```

### Test 2: Duplicate Email Prevention

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "duplicate",
    "email": "testuser@example.com",
    "password": "password123",
    "fullName": "Duplicate User",
    "role": "user"
  }'
```

**Expected Response:** `409 Conflict` with error about existing email.

### Test 3: Input Validation

```bash
# Test invalid email
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test",
    "email": "invalid-email",
    "password": "password123",
    "fullName": "Test",
    "role": "user"
  }'
```

**Expected Response:** `400 Bad Request` with validation errors.

## 📝 Blog System Testing

### Test 1: Get Published Blogs (Public Access)

```bash
curl "http://localhost:3000/api/blogs?page=1&limit=10"
```

**Expected Response:** Empty blogs array initially.

### Test 2: Create Blog (Authentication Required)

First, login as the superadmin to get session:

```bash
# This would typically be done via the frontend login
# For testing, we'll use the superadmin session
```

Create a blog with AI features:

```bash
curl -X POST http://localhost:3000/api/blogs \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "title": "My First AI Blog Post",
    "description": "A blog post created with AI assistance",
    "content": "This is the content of my blog post. Artificial intelligence is revolutionizing the way we create and consume content. From automated writing assistants to intelligent content recommendation systems, AI is making content creation more accessible and efficient than ever before.",
    "author_name": "Superadmin",
    "enableAI": true
  }'
```

**Expected Response:**

```json
{
  "message": "Blog created successfully",
  "blog": {
    "title": "My First AI Blog Post",
    "status": "published",
    "tags": ["artificial-intelligence", "content-creation", "technology"],
    "readingTime": 1
  },
  "aiAnalysis": {
    "tags": ["artificial-intelligence", "content-creation", "technology"],
    "seo": {
      "metaDescription": "Discover how AI is revolutionizing content creation...",
      "keywords": ["ai", "content", "creation", "artificial intelligence"]
    },
    "summary": "AI is transforming content creation through automated assistants...",
    "sentiment": {
      "sentiment": "positive",
      "score": 0.7
    }
  }
}
```

### Test 3: Create Blog as Unapproved Author

```bash
# Use the author account created earlier
# The blog should be created with "pending" status
```

### Test 4: Get Single Blog

```bash
curl "http://localhost:3000/api/blogs/BLOG_ID_HERE"
```

**Expected Response:** Blog details with author information populated.

### Test 5: Update Blog (Owner Only)

```bash
curl -X PUT http://localhost:3000/api/blogs/BLOG_ID_HERE \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "title": "Updated Blog Title",
    "description": "Updated description"
  }'
```

### Test 6: Delete Blog (Owner Only)

```bash
curl -X DELETE http://localhost:3000/api/blogs/BLOG_ID_HERE \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

## 💬 Comment System Testing

### Test 1: Get Comments for Blog

```bash
curl "http://localhost:3000/api/comments?blogId=BLOG_ID_HERE"
```

### Test 2: Create Comment with AI Moderation

```bash
curl -X POST http://localhost:3000/api/comments \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "blogId": "BLOG_ID_HERE",
    "content": "This is a great blog post! Very informative and well-written."
  }'
```

**Expected Response:**

```json
{
  "message": "Comment posted successfully",
  "comment": {
    "content": "This is a great blog post! Very informative and well-written.",
    "isApproved": true
  },
  "moderation": {
    "isValid": true,
    "issues": [],
    "suggestions": []
  }
}
```

### Test 3: Test Toxic Comment Detection

```bash
curl -X POST http://localhost:3000/api/comments \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "blogId": "BLOG_ID_HERE",
    "content": "This is terrible and horrible content!"
  }'
```

**Expected Response:** Comment created but `isApproved: false` with moderation issues.

### Test 4: Create Reply (Nested Comment)

```bash
curl -X POST http://localhost:3000/api/comments \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "blogId": "BLOG_ID_HERE",
    "parentId": "PARENT_COMMENT_ID",
    "content": "I agree with your comment!"
  }'
```

### Test 5: Like/Unlike Comment

```bash
# Like comment
curl -X POST http://localhost:3000/api/comments/COMMENT_ID/like \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"

# Unlike (same endpoint toggles)
curl -X POST http://localhost:3000/api/comments/COMMENT_ID/like \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

## 🤖 AI Features Testing

### Test 1: AI Writing Assistant

#### Generate Blog Titles

```bash
curl -X POST http://localhost:3000/api/ai/writing-assistant \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "topic": "artificial intelligence in healthcare",
    "count": 5
  }'
```

**Expected Response:** Array of 5 AI-generated blog titles.

#### Generate Blog Outline

```bash
curl "http://localhost:3000/api/ai/writing-assistant/generate-outline?topic=machine%20learning" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

#### Continue Writing

```bash
curl -X PUT http://localhost:3000/api/ai/writing-assistant/continue-writing \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "content": "Machine learning is a subset of artificial intelligence"
  }'
```

### Test 2: AI Image Generation

#### Generate Blog Cover

```bash
curl -X POST http://localhost:3000/api/ai/generate-image \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "prompt": "futuristic AI technology digital art",
    "style": "realistic"
  }'
```

**Expected Response:** Base64 encoded image data.

#### Generate Cover from Title

```bash
curl "http://localhost:3000/api/ai/generate-image/blog-cover?title=AI%20Revolution&category=technology" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

### Test 3: Content Analysis

```bash
curl -X POST http://localhost:3000/api/ai/analyze-content \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "title": "The Future of Technology",
    "content": "Technology is evolving at an unprecedented pace...",
    "generateSEO": true,
    "generateTags": true,
    "generateSummary": true
  }'
```

### Test 4: Content Moderation

```bash
curl -X POST http://localhost:3000/api/ai/moderate-content \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "content": "This is amazing content!",
    "type": "comment"
  }'
```

### Test 5: Semantic Search

```bash
curl -X POST http://localhost:3000/api/ai/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "artificial intelligence and machine learning",
    "limit": 5
  }'
```

### Test 6: Content Similarity

```bash
curl -X PUT http://localhost:3000/api/ai/search/similar \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "blogId": "BLOG_ID_HERE",
    "limit": 3
  }'
```

## 👑 Admin Features Testing

### Test 1: Get All Users (Admin Only)

```bash
curl "http://localhost:3000/api/admin/users?page=1&limit=10" \
  -H "Cookie: next-auth.session-token=ADMIN_SESSION_TOKEN"
```

### Test 2: Approve Author Request

```bash
# First, get pending requests
curl "http://localhost:3000/api/admin/role-upgrades?status=pending" \
  -H "Cookie: next-auth.session-token=ADMIN_SESSION_TOKEN"

# Then approve a request
curl -X PUT http://localhost:3000/api/admin/role-upgrades/REQUEST_ID_HERE \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=ADMIN_SESSION_TOKEN" \
  -d '{
    "action": "approve"
  }'
```

### Test 3: Approve Blog

```bash
curl -X POST http://localhost:3000/api/admin/blogs/BLOG_ID_HERE/approve \
  -H "Cookie: next-auth.session-token=ADMIN_SESSION_TOKEN"
```

### Test 4: Reject Blog with Reason

```bash
curl -X POST http://localhost:3000/api/admin/blogs/BLOG_ID_HERE/reject \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=ADMIN_SESSION_TOKEN" \
  -d '{
    "rejectionReason": "Content needs more detail and better structure."
  }'
```

### Test 5: Approve Comment

```bash
curl -X POST http://localhost:3000/api/admin/comments/COMMENT_ID_HERE/approve \
  -H "Cookie: next-auth.session-token=ADMIN_SESSION_TOKEN"
```

## 📊 Dashboard & Analytics Testing

### Test 1: User Dashboard

```bash
curl "http://localhost:3000/api/user/dashboard" \
  -H "Cookie: next-auth.session-token=USER_SESSION_TOKEN"
```

**Expected Response:** User statistics, reading history, comments, likes.

### Test 2: Author Dashboard

````bash
curl "http://localhost:3000/api/user/dashboard" \
### Test 3: AI Dashboard
```bash
curl "http://localhost:3000/api/ai/dashboard" \
  -H "Cookie: next-auth.session-token=USER_SESSION_TOKEN"
````

**Expected Response:** AI insights, content analytics, recommendations.

## 🎨 Banner Management Testing

### Test 1: Get All Banners (Admin Only)

```bash
curl "http://localhost:3000/api/admin/banners?page=1&limit=10" \
  -H "Cookie: next-auth.session-token=ADMIN_SESSION_TOKEN"
```

**Expected Response:** List of banners with pagination and metadata.

### Test 2: Create New Banner (Admin Only)

```bash
curl -X POST http://localhost:3000/api/admin/banners \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=ADMIN_SESSION_TOKEN" \
  -d '{
    "title": "Welcome to Blogiz",
    "subtitle": "AI-Powered Blog Platform",
    "description": "Experience the future of content creation with our AI-powered blogging platform.",
    "image": "/uploads/banners/welcome-banner.jpg",
    "ctaText": "Get Started",
    "ctaLink": "/auth/register",
    "type": "hero",
    "targetAudience": "all",
    "isActive": true,
    "order": 1,
    "metadata": {
      "backgroundColor": "#3b82f6",
      "textColor": "#ffffff",
      "buttonColor": "#10b981",
      "animation": "slide",
      "autoSlide": true,
      "slideInterval": 5
    }
  }'
```

**Expected Response:** Created banner with all details and populated creator information.

### Test 3: Upload Banner Image (Admin Only)

```bash
# Create a test image file first (banner-test.jpg)
curl -X POST http://localhost:3000/api/admin/banners/upload \
  -H "Cookie: next-auth.session-token=ADMIN_SESSION_TOKEN" \
  -F "file=@banner-test.jpg"
```

**Expected Response:** Image upload success with URL and file details.

### Test 4: Update Banner (Admin Only)

```bash
curl -X PUT http://localhost:3000/api/admin/banners/BANNER_ID_HERE \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=ADMIN_SESSION_TOKEN" \
  -d '{
    "title": "Updated Banner Title",
    "isActive": false,
    "order": 2
  }'
```

**Expected Response:** Updated banner information.

### Test 5: Reorder Banners (Admin Only)

```bash
curl -X PUT http://localhost:3000/api/admin/banners/reorder \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=ADMIN_SESSION_TOKEN" \
  -d '{
    "bannerOrders": [
      {"id": "BANNER_ID_1", "order": 1},
      {"id": "BANNER_ID_2", "order": 2},
      {"id": "BANNER_ID_3", "order": 3}
    ]
  }'
```

**Expected Response:** Banners reordered successfully.

### Test 6: Get Public Banners (No Auth Required)

```bash
# Get hero carousel banners
curl "http://localhost:3000/api/banners?type=hero&carousel=true&limit=5"

# Get featured banners
curl "http://localhost:3000/api/banners?type=featured&limit=3"

# Get announcement banners
curl "http://localhost:3000/api/banners?type=announcement&limit=2"
```

**Expected Response:** Active banners filtered by type with carousel settings.

### Test 7: Test Banner Display by User Role

```bash
# Test as regular user (should show user-targeted banners)
curl "http://localhost:3000/api/banners" \
  -H "Cookie: next-auth.session-token=USER_SESSION_TOKEN"

# Test as author (should show author-targeted banners)
curl "http://localhost:3000/api/banners" \
  -H "Cookie: next-auth.session-token=AUTHOR_SESSION_TOKEN"

# Test as admin (should show admin-targeted banners)
curl "http://localhost:3000/api/banners" \
  -H "Cookie: next-auth.session-token=ADMIN_SESSION_TOKEN"
```

**Expected Response:** Different banner sets based on user role.

### Test 8: Test Date-Based Banner Scheduling

```bash
# Create banner with date range
curl -X POST http://localhost:3000/api/admin/banners \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=ADMIN_SESSION_TOKEN" \
  -d '{
    "title": "Limited Time Offer",
    "description": "Special promotion available this week only!",
    "image": "/uploads/banners/promo.jpg",
    "type": "promotion",
    "startDate": "2026-02-22",
    "endDate": "2026-02-29",
    "isActive": true
  }'
```

**Expected Response:** Banner created with date scheduling.

### Test 9: Delete Banner (Admin Only)

```bash
curl -X DELETE http://localhost:3000/api/admin/banners/BANNER_ID_HERE \
  -H "Cookie: next-auth.session-token=ADMIN_SESSION_TOKEN"
```

**Expected Response:** Banner deleted successfully.

### Test 10: Banner Carousel Functionality

```bash
# Test carousel settings
curl "http://localhost:3000/api/banners?type=hero&carousel=true"
```

**Expected Response:**

```json
{
  "banners": [...],
  "carouselSettings": {
    "autoSlide": true,
    "slideInterval": 5000,
    "animation": "slide",
    "showIndicators": true,
    "showNavigation": true,
    "infinite": true
  },
  "count": 3,
  "targetAudience": "all"
}
```

## 🔄 Role Upgrade Testing

### Test 1: Request Role Upgrade

```bash
curl -X POST http://localhost:3000/api/user/role-upgrade \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=USER_SESSION_TOKEN" \
  -d '{
    "requestedRole": "author",
    "reason": "I want to share my knowledge and contribute to the community through writing informative blog posts about technology and innovation."
  }'
```

### Test 2: Check Request Status

```bash
curl "http://localhost:3000/api/user/role-upgrade" \
  -H "Cookie: next-auth.session-token=USER_SESSION_TOKEN"
```

## 🔍 Advanced Features Testing

### Test 1: Blog View Tracking

```bash
curl -X POST http://localhost:3000/api/blogs/BLOG_ID_HERE/view \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=USER_SESSION_TOKEN"
```

### Test 2: Blog Like System

```bash
# Like blog (Note: You'll need to implement this endpoint if not exists)
curl -X POST http://localhost:3000/api/blogs/BLOG_ID_HERE/like \
  -H "Cookie: next-auth.session-token=USER_SESSION_TOKEN"
```

### Test 3: User Profile Management

```bash
# Get user profile
curl "http://localhost:3000/api/users/USER_ID_HERE"

# Update user profile
curl -X PUT http://localhost:3000/api/users/USER_ID_HERE \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=USER_SESSION_TOKEN" \
  -d '{
    "profile": {
      "fullName": "Updated Name",
      "bio": "Updated bio",
      "website": "https://example.com",
      "expertise": ["technology", "writing"]
    }
  }'
```

## 🚀 Performance & Security Testing

### Test 1: Rate Limiting

Make multiple rapid requests to the same endpoint to test rate limiting.

### Test 2: Input Validation

Try various malicious inputs:

```bash
# XSS attempt
curl -X POST http://localhost:3000/api/comments \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "blogId": "BLOG_ID_HERE",
    "content": "<script>alert('xss')</script>"
  }'
```

### Test 3: SQL Injection Protection

```bash
curl "http://localhost:3000/api/blogs?search='; DROP TABLE users; --"
```

### Test 4: Authentication Bypass

Try accessing protected endpoints without authentication:

```bash
curl "http://localhost:3000/api/admin/users"
```

**Expected Response:** `401 Unauthorized`

## 📱 Mobile & Browser Testing

### Test Different Browsers

- Chrome/Chromium
- Firefox
- Safari
- Edge

### Test Responsive Design

- Desktop (1920x1080)
- Tablet (768x1024)
- Mobile (375x667)

## 🔧 Troubleshooting

### Common Issues & Solutions

#### Issue 1: "HuggingFace API key not found"

**Solution:** Ensure `HUGGINGFACE_API_KEY` is set in `.env.local`

#### Issue 2: "MongoDB connection failed"

**Solution:** Check MongoDB URI and ensure MongoDB is running

#### Issue 3: "NextAuth secret not found"

**Solution:** Set `NEXTAUTH_SECRET` in environment variables

#### Issue 4: AI features return empty results

**Solution:** Check HuggingFace API key and internet connection

#### Issue 5: Comments not auto-approving

**Solution:** Check user permissions and TensorFlow.js initialization

#### Issue 6: Role upgrade not working

**Solution:** Ensure user is logged in and has proper session

### Debug Mode

Enable debug logging by setting:

```env
NODE_ENV=development
```

Check browser console and server logs for detailed error information.

### Database Verification

Connect to your MongoDB and verify:

```javascript
// Check collections
db.users.find().pretty();
db.blogs.find().pretty();
db.comments.find().pretty();
```

## ✅ Testing Checklist

### Core Functionality

- [ ] User registration (user and author roles)
- [ ] Login/logout functionality
- [ ] Blog CRUD operations
- [ ] Comment system with moderation
- [ ] Role-based permissions

### AI Features

- [ ] AI writing assistance
- [ ] AI image generation
- [ ] Content analysis and SEO
- [ ] Comment moderation
- [ ] Semantic search

### Admin Features

- [ ] User management
- [ ] Content approval
- [ ] Role upgrade management
- [ ] Analytics dashboard
- [ ] Banner management and carousel functionality

### Security

- [ ] Authentication enforcement
- [ ] Input validation
- [ ] XSS protection
- [ ] SQL injection protection

### Performance

- [ ] Response times under 2 seconds
- [ ] Database queries optimized
- [ ] AI features responsive
- [ ] Error handling graceful

## 🎯 Next Steps After Testing

1. **Frontend Development**: Build React components for all features
2. **UI/UX Design**: Create beautiful, responsive interfaces
3. **Performance Optimization**: Implement caching and optimization
4. **Additional Features**: Add email notifications, real-time updates
5. **Deployment**: Deploy to production environment
6. **Monitoring**: Set up analytics and error tracking

---

**🎉 Congratulations!** If you've completed all tests, your AI-powered blog platform is fully functional and ready for the next development phase!

For any issues or questions, refer to the troubleshooting section or create an issue in the repository.
