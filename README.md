# Interactive Ideas Platform

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![Convex](https://img.shields.io/badge/Convex-Backend-orange?style=for-the-badge&logo=convex)
![Clerk](https://img.shields.io/badge/Clerk-Auth-purple?style=for-the-badge&logo=clerk)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-Styling-38B2AC?style=for-the-badge&logo=tailwind-css)

A modern React/Next.js application for sharing and discovering innovative ideas, built with Convex backend and Clerk authentication.

## 🚀 Features

### ✨ Core Functionality
- **Idea Creation**: Comprehensive form for submitting innovative concepts
- **Real-time Feed**: Live updates of user-created ideas
- **User Authentication**: Secure login/signup with Clerk
- **Theme Support**: Dark/light mode with Tailwind CSS
- **Responsive Design**: Mobile-first design with consistent UI

### 🏗️ Technical Stack
- **Frontend**: Next.js 15 with React 19
- **Backend**: Convex for real-time database and APIs
- **Authentication**: Clerk for user management
- **Styling**: Tailwind CSS with CSS variables
- **UI Components**: Radix UI primitives with shadcn/ui
- **Development**: Turbopack for fast builds

### 🛠️ Key Features
- **Form Validation**: Client-side validation with error handling
- **File Upload**: Ready for media attachments (currently text-only)
- **Database Integration**: Convex schema with proper indexing
- **Type Safety**: Full TypeScript implementation
- **Clean Build**: ESLint compliant with zero warnings

## 📦 Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm
- GitHub account with repository created

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Saunakghosh10/interactive.git
   cd interactive
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment setup:**
   ```bash
   # Create .env.local file with your keys:
   NEXT_PUBLIC_CONVEX_URL=your_convex_url
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
   CLERK_SECRET_KEY=your_clerk_secret
   ```

4. **Start Convex development server:**
   ```bash
   npx convex dev
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   ```

### Deployment

1. **Build for production:**
   ```bash
   npm run build
   ```

2. **Deploy Convex:**
   ```bash
   npx convex deploy
   ```

3. **Deploy Next.js to Vercel:**
   ```bash
   vercel --prod
   ```

## 🎯 Usage

### Creating Ideas
1. Navigate to `/feed` and click "Create Idea"
2. Fill out the form with title, description, and category
3. Choose visibility (Public/Private)
4. Submit to see your idea on the feed

### Authentication
1. Use `/sign-up` for new accounts
2. Use `/sign-in` to log into existing accounts
3. All ideas are associated with authenticated users

### Feed Navigation
1. Browse public ideas on the main feed
2. Click on any idea to view details
3. Use filters and search (coming soon)

## 📁 Project Structure

```
interactive/
├── app/                    # Next.js app directory
│   ├── create-idea/       # Idea creation page
│   ├── feed/             # Main ideas feed
│   ├── profile/          # User profiles
│   ├── sign-in/          # Authentication
│   └── sign-up/          # Registration
├── components/           # Reusable UI components
├── convex/              # Backend queries and mutations
│   ├── ideas.ts         # Idea CRUD operations
│   ├── schema.ts        # Database schema
│   ├── users.ts         # User operations
│   └── auth.config.ts   # Authentication config
├── lib/                 # Utilities and configurations
├── public/             # Static assets
├── .env.local          # Environment variables (gitignored)
└── README.md           # This file
```

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint checks
```

### Adding Features
1. **New Components**: Follow the `components/` structure
2. **Database Schema**: Update `convex/schema.ts`
3. **API Endpoints**: Add mutations/queries to `convex/*.ts`
4. **UI Elements**: Use existing shadcn/ui components
5. **Environment Variables**: Add to `.env.local` and document

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and commit
4. Push to your fork and create a PR

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Convex** for real-time backend infrastructure
- **Clerk** for seamless authentication
- **Next.js** for the modern React framework
- **Tailwind CSS** for utility-first styling
- **shadcn/ui** for beautiful UI components

## 📞 Support

If you have issues or questions:
- Check the [Convex docs](https://docs.convex.dev)
- Check the [Next.js docs](https://nextjs.org/docs)
- Look at [Clerk documentation](https://clerk.com/docs)

---

**Built with ❤️ using Next.js, Convex, and modern web technologies**
