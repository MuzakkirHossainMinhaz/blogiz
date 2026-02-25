# 🤖 Blogiz - AI-Powered Multi-User Blog Platform

A state-of-the-art blog platform with comprehensive AI integration, role-based permissions, and advanced analytics. Built with Next.js 13, MongoDB, and cutting-edge AI technologies.

## ✨ Key Features

### 🤖 **AI-Powered Content Creation**

- **Smart Writing Assistant**: AI-powered blog title generation, outlines, and content continuation
- **Automatic SEO Optimization**: AI-generated meta descriptions, keywords, and summaries
- **Intelligent Tagging**: Automatic tag generation based on content analysis
- **Content Quality Scoring**: AI-driven readability and quality assessment
- **Sentiment Analysis**: Understand the emotional tone of your content

### 🎨 **AI Image Generation**

- **Blog Cover Generation**: Create stunning blog covers from titles using Stable Diffusion
- **Multiple Styles**: Realistic, artistic, and digital image styles
- **Author Avatars**: AI-generated profile pictures for authors
- **Custom Illustrations**: Generate relevant images for blog content

### 🛡️ **Intelligent Content Moderation**

- **Real-time Toxicity Detection**: TensorFlow-powered comment moderation
- **Auto-Approval System**: Clean content automatically approved
- **Quality Feedback**: Actionable suggestions for content improvement
- **Spam Prevention**: Advanced filtering and detection systems

### 🔍 **Smart Search & Discovery**

- **Semantic Search**: AI-powered search that understands meaning, not just keywords
- **Personalized Recommendations**: Content suggestions based on user behavior
- **Content Similarity**: Find related articles automatically
- **Trending Topics**: Discover what's popular in the community

### 👥 **Multi-User System**

- **Role-Based Access Control**: Superadmin, Admin, Author, and User roles
- **User Registration**: Choose between Reader and Author accounts
- **Approval Workflows**: Authors require admin approval to publish
- **Profile Management**: Comprehensive user profiles with social links

### 📊 **Advanced Analytics**

- **Content Performance**: Track views, likes, comments, and engagement
- **User Behavior Analytics**: Understand how users interact with content
- **AI Insights**: Get AI-powered recommendations for improvement
- **Dashboard Analytics**: Comprehensive dashboards for all user types

### 💬 **Engagement Features**

- **Nested Comments**: Threaded discussions with replies
- **Like System**: Engage with blogs and comments
- **View Tracking**: Detailed analytics with anti-spam protection
- **Activity Feeds**: Track user interactions and engagement

### 🎨 **Dynamic Banner Management**

- **Admin-Controlled Carousels**: Fully manageable banner system from admin dashboard
- **Multiple Banner Types**: Hero, featured, announcement, and promotion banners
- **Targeted Display**: Show different banners to different user roles (users, authors, admins)
- **Carousel Functionality**: Auto-slide with customizable animations and intervals
- **Visual Customization**: Custom colors, animations, and styling options
- **Image Management**: Secure upload system with validation and optimization
- **Date-Based Scheduling**: Set start/end dates for timed campaigns
- **Responsive Design**: Mobile-friendly carousel with touch gestures

## 🛠️ Technology Stack

### **Frontend**

- **Next.js 13**: App Router with server components
- **TypeScript**: Full type safety throughout
- **Tailwind CSS**: Modern, responsive design
- **React Hooks**: Modern React patterns

### **Backend**

- **Next.js API Routes**: Serverless API endpoints
- **MongoDB**: NoSQL database with Mongoose ODM
- **NextAuth v5**: Secure authentication system
- **Zod**: Runtime type validation

### **AI & Machine Learning**

- **HuggingFace**: Free AI models for text and image generation
  - `distilgpt2`: Text generation and writing assistance
  - `stable-diffusion`: Image generation
  - `twitter-roberta-base-sentiment`: Sentiment analysis
  - `bert-base-NER`: Keyword extraction
- **TensorFlow.js**: Client-side AI processing
  - Toxicity detection
  - Sentiment analysis
  - Content similarity matching

### **Infrastructure**

- **Vercel**: Deployment platform (or any Next.js hosting)
- **MongoDB Atlas**: Cloud database (or local MongoDB)
- **Environment Variables**: Secure configuration management

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or MongoDB Atlas)
- HuggingFace API key (free)

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd blogiz
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**
   Create a `.env.local` file:

```env
# Database
MONGODB_URI="mongodb://localhost:27017/blogiz"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# HuggingFace AI (Free)
HUGGINGFACE_API_KEY="your-huggingface-api-key"

# Optional: Email Configuration
EMAIL_FROM="noreply@yourdomain.com"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

4. **Run the development server**

```bash
npm run dev
```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📋 Initial Setup

### 1. Create Superadmin Account

```bash
# Run the seed endpoint to create superadmin
curl -X POST http://localhost:3000/api/seed \
  -H "Content-Type: application/json" \
  -d '{"email": "superadmin@blogiz.com", "password": "superadmin123"}'
```

**Default Superadmin Credentials:**

- Email: `superadmin@blogiz.com`
- Password: `superadmin123`

### 2. Configure HuggingFace API

1. Visit [HuggingFace](https://huggingface.co/)
2. Create a free account
3. Go to Settings → Access Tokens
4. Create a new token (read permissions are sufficient)
5. Add the token to your `.env.local` file

### 3. Test the System

- Register as a new user
- Try upgrading to Author role
- Create a blog with AI assistance
- Test comment moderation
- Explore the dashboard

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js 13 App Router
│   ├── api/               # API endpoints
│   │   ├── auth/          # Authentication routes
│   │   ├── blogs/         # Blog CRUD operations
│   │   ├── comments/      # Comment system
│   │   ├── ai/            # AI-powered features
│   │   ├── admin/         # Admin management
│   │   └── user/          # User management
│   ├── auth/              # Authentication pages
│   └── dashboard/         # User dashboards
├── lib/                   # Utility libraries
│   ├── auth.ts           # NextAuth configuration
│   ├── mongodb.ts        # Database connection
│   ├── huggingface.ts    # AI integration
│   ├── tensorflow.ts     # Client-side AI
│   ├── permissions.ts    # Role-based permissions
│   └── env-config.ts     # Environment validation
├── models/               # Database models
│   ├── User.ts           # User schema
│   ├── Blog.ts           # Blog schema
│   ├── Comment.ts        # Comment schema
│   ├── Like.ts           # Like tracking
│   ├── BlogView.ts       # View analytics
│   ├── Banner.ts         # Banner management
│   └── RoleUpgradeRequest.ts # Role management
└── components/           # React components
    ├── ui/               # Reusable UI components
    ├── forms/            # Form components
    └── dashboard/        # Dashboard components
```

## 🎯 Core Features Explained

### User Roles & Permissions

#### **Superadmin**

- Complete system control
- User role management
- Platform configuration
- Full content oversight

#### **Admin**

- Content moderation
- User management (except superadmin)
- Blog approval/rejection
- Comment moderation

#### **Author**

- Create and manage blogs
- Comment on posts
- View analytics
- Request role upgrades

#### **User**

- Read published blogs
- Comment on posts
- Like content
- Request author upgrade

### AI Features

#### **Writing Assistant**

```typescript
// Generate blog titles
POST /api/ai/writing-assistant
{
  "topic": "artificial intelligence",
  "count": 5
}

// Generate blog outline
GET /api/ai/writing-assistant/generate-outline?topic=AI

// Continue writing
PUT /api/ai/writing-assistant/continue-writing
{
  "content": "Artificial intelligence is..."
}
```

#### **Image Generation**

```typescript
// Generate blog cover
POST /api/ai/generate-image
{
  "prompt": "futuristic technology blog",
  "style": "realistic"
}

// Generate from title
GET /api/ai/generate-image/blog-cover?title=AI&category=technology
```

#### **Content Analysis**

```typescript
// Analyze content
POST /api/ai/analyze-content
{
  "title": "My Blog Post",
  "content": "Full blog content...",
  "generateSEO": true,
  "generateTags": true
}
```

### API Endpoints

#### **Authentication**

- `POST /api/auth/register` - User registration
- `POST /api/auth/[...nextauth]` - NextAuth handlers

#### **Blogs**

- `GET /api/blogs` - Get published blogs
- `POST /api/blogs` - Create blog (with AI)
- `GET /api/blogs/[id]` - Get single blog
- `PUT /api/blogs/[id]` - Update blog
- `DELETE /api/blogs/[id]` - Delete blog

#### **Comments**

- `GET /api/comments` - Get blog comments
- `POST /api/comments` - Create comment (with moderation)
- `PUT /api/comments/[id]` - Update comment
- `DELETE /api/comments/[id]` - Delete comment
- `POST /api/comments/[id]/like` - Like/unlike comment

#### **AI Features**

- `POST /api/ai/writing-assistant` - Writing assistance
- `POST /api/ai/generate-image` - Image generation
- `POST /api/ai/analyze-content` - Content analysis
- `POST /api/ai/moderate-content` - Content moderation
- `POST /api/ai/search` - Semantic search
- `GET /api/ai/dashboard` - AI analytics

#### **Admin**

- `GET /api/admin/users` - User management
- `GET /api/admin/role-upgrades` - Role upgrade requests
- `POST /api/admin/blogs/[id]/approve` - Approve blog
- `POST /api/admin/comments/[id]/approve` - Approve comment
- `GET /api/admin/banners` - Banner management (list/create)
- `GET /api/admin/banners/[id]` - Get single banner
- `PUT /api/admin/banners/[id]` - Update banner
- `DELETE /api/admin/banners/[id]` - Delete banner
- `POST /api/admin/banners/upload` - Upload banner image
- `PUT /api/admin/banners/reorder` - Reorder banners

#### **Public Banners**

- `GET /api/banners` - Get active banners for display
- `GET /api/banners?type=hero&carousel=true` - Get hero carousel
- `GET /api/banners?type=featured` - Get featured banners

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

### Environment Variables

All environment variables are validated using Zod schemas. See `src/lib/env-config.ts` for the complete list.

### Database Models

All models are fully typed with TypeScript interfaces and include proper validation, indexing, and relationships.

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms

The app works on any Next.js-compatible hosting platform:

- Netlify
- AWS Amplify
- DigitalOcean App Platform
- Self-hosted VPS

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the [GUIDE.md](./GUIDE.md) for detailed testing instructions
- Review the API documentation in the codebase

---

**Built with ❤️ and cutting-edge AI technology**
