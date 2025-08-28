# iam-security-system

# iam-security-system

1. Clone the Repository:-
   git clone <YOUR_REPO_URL>
   cd iam-security-system

2. Install Dependencies:-
    Backend
    cd backend
    npm install

    Frontend
    cd ../frontend
    npm install
   
4. Setup Environment Variables (Backend):-

    Create a new file named .env inside the backend folder:

    iam-security-system/
    ├── backend/
    │   ├── .env   👈 create this here
    │   └── ...
    └── frontend/

5. Prisma Setup:-

    From inside the backend/ folder, run:
    
    # Generate Prisma client
    npx prisma generate
    
    # Apply migrations (creates tables in Supabase)
    npx prisma migrate dev
    
    
    (Optional) Run the seed script to insert roles, permissions, and a default admin:
    
    npx prisma db seed

6. Run the Servers:-
    Backend
    cd backend
    npm run dev
    
    
    ➡️ Backend runs at: http://localhost:3000

    Frontend
    cd frontend
    npm run dev
    
    
    ➡️ Frontend runs at: http://localhost:5173

7. Default Admin Account:-

    After seeding, you’ll have a default admin account:
    
    Email: admin@example.com
    
    Password: Admin@12345
    
    Use this account to log in and test the system.
