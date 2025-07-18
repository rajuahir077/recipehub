🍳 RecipeHub – Share Your Favorite Recipes
RecipeHub is a web-based application that allows users to share, browse, edit, and delete recipes. Built with HTML, CSS, JavaScript, Node.js, Express, and MySQL, it features dynamic forms, image uploads, user authentication, and category browsing.

---

🚀 Features

✨ Add, edit, and delete your own recipes with dynamic ingredient/step forms

👥 User signup and login (with secure password hashing using bcrypt)

📂 Upload recipe images (stored locally)

🍱 Browse recipes by category (e.g., Breakfast, Lunch, Dinner, etc.)

📋 View recipe details on a separate page

🎨 Colorful, responsive frontend layout (fun, vibrant UI)

---

🛠️ Tech Stack

Frontend: HTML, CSS, JavaScript

Backend: Node.js, Express

Database: MySQL (using MySQL Workbench)

File Uploads: multer (for storing recipe images)

Password Security: bcrypt

---

📁 Folder Structure
perl

RecipeHub/
├── backend/
│   ├── uploads/                # Uploaded recipe images
│   ├── server.js               # Main backend server file
│   ├── package.json            # Backend dependencies
│   ├── package-lock.json
│
├── frontend/
│   ├── assets/                 # Logo/images used in UI
│   ├── add-recipe.html         # Add new recipe page
│   ├── category.html           # Browse by category
│   ├── dashboard.html          # Community & popular recipes
│   ├── edit-recipe.html        # Edit existing recipe
│   ├── index.html              # Homepage
│   ├── login.html              # User login
│   ├── signup.html             # User signup
│   ├── view-recipe.html        # View full recipe
│   ├── style.css               # Custom responsive styling
│   └── script.js               # Dynamic ingredient/step functionality
│
├── README.md                   # Project overview (this file)
└── RecipeHub.code-workspace    # VS Code workspace file

---

🔐 MySQL Configuration

Before running the backend, update the database connection credentials inside server.js:


const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',                // ← MySQL username
  password: '03062001@Raju',   // ← MySQL password
  database: 'recipehub'
});

Ensure your MySQL Server and MySQL Workbench are running, and that the database recipehub is created.

---

📦 Installation & Setup
Clone the repository (or download ZIP & extract):

bash

git clone https://github.com/your-rajuahir077/recipehub.git
Navigate to the backend folder:

bash

cd RecipeHub/backend
Install dependencies:

bash

npm install
Start the backend server:

bash

node server.js
Open your browser and go to:

arduino

http://localhost:3000

---

🧪 Test Cases

✅ User Authentication
Sign up with full name, email, and password → gets stored in MySQL

Login with correct credentials → redirected to dashboard

Invalid credentials → error message shown

Already registered email → signup error

Unauthorized page access → redirects to login

✅ Recipe Management
Add a recipe → includes image upload and dynamic fields

View full recipe → shows description, image, ingredients, steps

Edit recipe → pre-fills data and allows updates

Delete recipe → instantly removes it from the database

✅ Frontend Navigation
Homepage with categories → clickable navigation

Dashboard → shows 6 fixed popular + community recipes

Category page → filters recipes by selected type

