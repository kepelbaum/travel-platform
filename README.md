# VoidWander Travel Platform

A full-stack intelligent trip planning application featuring real-time Google Places integration, smart caching, and conflict-aware scheduling.

## Features

### Core Trip Planning
* Trip creation and management with date validation
* Activity scheduling with time conflict detection
* Cost tracking (estimated vs actual)
* Multi-destination trip support
* Activity categorization and filtering

### Google Places Integration
* 100+ real attractions across 9 major cities (Paris, Tokyo, Rome, NYC, Barcelona, St. Petersburg, Singapore, Hong Kong, Prague)
* Real photos, ratings, and reviews from Google Places API
* Smart caching with 30-day TTL and auto-refresh
* Place details with opening hours and contact information
* City-specific cost multipliers for accurate pricing

### Smart Features
* Timezone-aware scheduling and conflict detection
* Intelligent activity deduplication
* Cache freshness monitoring
* Responsive design with light/dark themes
* Demo login for easy portfolio viewing

### User Experience
* JWT authentication with secure token management
* Real-time error handling with specific conflict messages
* Mobile-responsive interface
* Activity browsing with category filters
* Trip timeline view with intelligent scheduling validation

## Tech Stack

### Frontend
* Next.js 14 (TypeScript)
* TanStack Query for state management
* Zustand for authentication
* Tailwind CSS for styling
* Deployed on Vercel

### Backend
* Java Spring Boot
* PostgreSQL with optimized indexing
* Spring Security with JWT
* Spring Cache for API response caching
* RESTful API architecture
* Docker containerization
* Deployed on Railway

### External APIs
* Google Places API for attraction data
* Google Places Photos API for images

## Live App

Try it here: [VoidWander](https://voidwander.vercel.app)

**Demo Login:**
* Email: john1@example.com
* Password: password123

## Local Development

1. `git clone https://github.com/kepelbaum/travel-platform`
2. `cd travel-platform`

### Frontend Setup
```bash
cd frontend
npm install
# Configure .env.local with API URLs
npm run dev
```

### Backend Setup
```bash
cd backend
# Configure application.properties with:
# - PostgreSQL database credentials
# - Google Places API key
# - JWT secret
docker compose up --build
```

## Architecture Highlights

### Smart Caching Strategy
* 30-day cache TTL with automatic staleness detection
* Graceful API fallbacks on failures
* Batch processing to minimize API calls
* Duplicate prevention across Place IDs and names

### Conflict Detection
* Time-based scheduling validation
* Trip date boundary enforcement
* Timezone-aware calculations
* User-friendly error messages

### Efficient Design
* Paginated activity browsing
* Optimized database queries with proper indexing
* Smart API call batching to minimize requests
* Stateless JWT authentication

## Planned Features

### Flight & Hotel Data
Powered by Amadeus API - search flights, check hotel availability, and get pricing estimates for complete trip planning.
**Coming Q4 2026**

### AI Trip Optimization
Smart recommendations based on your preferences, spending patterns, and optimal activity sequencing using machine learning.
**Coming Q4 2026**

### Smart Route Planning
Google Maps integration for travel time calculations, route optimization, and realistic scheduling between activities.
**Coming Q1 2027**

## Future Improvements

* UI polish and component refactoring
* Split large service files for better maintainability
* Enhanced mobile experience
* Advanced filtering and search capabilities
* Social features (trip sharing, reviews)
* Offline mode support

Feel free to contribute or report issues!