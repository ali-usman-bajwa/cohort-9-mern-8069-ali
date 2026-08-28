# cohort-9-mern-8069-ali
Cohort 9 — MERN (NodeJS+ReactJS) assignment for Ali Usman Bajwa

## Project Overview
A full-stack Notes App with user authentication, category management, and rich text note editing. Frontend and backend are both complete and connected.

## Tech Stack

### Frontend
- React.js (Vite)
- React Router DOM
- TipTap Rich Text Editor
- Context API
- Axios
- Plain CSS

### Backend
- Node.js + Express.js
- MongoDB + Mongoose
- JWT Authentication
- Pino Logger
- Bcrypt password hashing
- CORS

### Testing & Quality
- Vitest + React Testing Library (frontend)
- Mocha/Chai (backend)
- SonarQube (code quality & coverage)

## Security Note
JWT token is currently stored in localStorage for development purposes.
In production, HttpOnly cookies should be used instead.

## Current Progress

### ✅ Frontend — Auth
- Login page with form validation and semantic form structure
- Signup page with form validation and labels
- Real API calls — connected to backend
- JWT token stored in localStorage on login
- React Router navigation between Login, Signup, Dashboard
- Protected routes — dashboard inaccessible without login
- Password hint on signup (min 8 characters)

### ✅ Frontend — Dashboard
- Navbar with search bar, user avatar, logout button
- Categories fetched from backend
- General category — built-in, cannot be deleted
- User-created categories with 3-dot menu
- Delete category modal — move notes to General OR delete all notes
- New Category modal with duplicate name validation
- Global search — searches both categories and notes simultaneously

### ✅ Frontend — Note Editor
- Rich text editor using TipTap
- Toolbar with Bold, Italic, Strike, H1, H2, Bullet List, Ordered List, Code Block
- Category selection dropdown — choose existing or create new inline
- Create and edit notes via backend API

### ✅ Frontend — Category View
- Notes fetched from backend
- Search within a category
- Edit, delete note
- Move notes from General to user categories

### ✅ Frontend — Note View
- Readable note page with full rich text rendering
- Change category button
- Edit button → opens Note Editor in edit mode

### ✅ Frontend — State Management
- React Context API (NotesContext)
- All API calls via Axios
- Real-time UI updates after every operation

### ✅ Frontend — Testing
- Vitest + React Testing Library
- Login, Signup, Dashboard, CategoryCard, NewCategoryModal, NoteEditor, NoteView tests
- 78 tests passing
- SonarQube coverage configured with lcov reports

### ✅ Backend — Auth APIs
- POST /api/auth/signup — register user + auto-create General category
- POST /api/auth/login — login with JWT token
- Atomic transaction for user + General category creation

### ✅ Backend — Category APIs
- GET /api/categories — get all user categories
- POST /api/categories — create new category
- DELETE /api/categories/:id — delete category (move or delete notes)

### ✅ Backend — Notes APIs
- GET /api/notes — get all user notes
- GET /api/notes/category/:categoryId — get notes by category
- POST /api/notes — create note
- PUT /api/notes/:id — update note
- DELETE /api/notes/:id — delete note
- PUT /api/notes/move — move notes to another category
- GET /api/notes/search?q= — search notes by title

### ✅ Backend — Middleware
- JWT auth middleware — protected routes
- Global error handler
- 404 not found handler
- Pino HTTP request logging
- CORS configured

### ✅ Backend — Testing
- Mocha/Chai test suite
- Auth, Category, Note API tests
- MongoDB Atlas test integration

### ✅ Code Quality
- SonarQube integration
- Coverage reports via lcov
- Security hotspots addressed
- Accessibility improvements (dialog, button roles)

## Folder Structure

```text
cohort-9-mern-8070-amna/
  frontend/
    src/
      api/
        axios.js
      components/
        auth/
          Login.jsx
          Login.css
          Signup.jsx
          Signup.css
        dashboard/
          Navbar.jsx
          Navbar.css
          CategoryCard.jsx
          CategoryCard.css
          NewCategoryModal.jsx
          NewCategoryModal.css
      context/
        NotesContext.jsx
      pages/
        Dashboard.jsx
        Dashboard.css
        NoteEditor.jsx
        NoteEditor.css
        CategoryView.jsx
        CategoryView.css
        NoteView.jsx
        NoteView.css
      tests/
        setup.js
        Login.test.jsx
        Signup.test.jsx
        Dashboard.test.jsx
        CategoryCard.test.jsx
        NewCategoryModal.test.jsx
        NoteEditor.test.jsx
        NoteView.test.jsx
      index.css
      App.jsx
      main.jsx
  backend/
    src/
      config/
        db.js
      controllers/
        authController.js
        categoryController.js
        noteController.js
      middleware/
        authMiddleware.js
        errorMiddleware.js
      models/
        User.js
        Category.js
        Notes.js
      routes/
        authRoutes.js
        categoryRoutes.js
        noteRoutes.js
      tests/
        auth.test.js
        category.test.js
        note.test.js
    server.js
    .env.example
```

## How to Run

### Backend
```bash
cd backend
npm install
# make env file, & add MONGODB_URI, JWT_SECRET, PORT
npm run dev
```

> Note: MongoDB Atlas or replica set required. Standalone MongoDB does not support transactions.

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Run Tests

#### Frontend
```bash
cd frontend
npm run test
```

#### Backend
```bash
cd backend
npm test
```

#### Frontend Coverage
```bash
cd frontend
npm run test -- --coverage
```

## Environment Variables

```text
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
PORT=5000
```