// server.js - FIXED & READY FOR RENDER DEPLOYMENT
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ----------------------- MULTER (FILE UPLOADS) -----------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// ----------------------- DATABASE CONNECTION -----------------------
const dbUrl = process.env.MYSQL_URL || process.env.DB_URL;

let db;
if (dbUrl) {
  console.log("Using cloud DB URL...");
  db = mysql.createConnection(dbUrl);
} else {
  console.log("⚠ WARNING: No DB URL found. Using LOCAL MySQL.");
  db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '03062001@Raju', 
    database: 'recipehub'
  });
}

db.connect(err => {
  if (err) {
    console.error("❌ MySQL connection failed:", err.message);
  } else {
    console.log("✅ MySQL connected successfully.");
  }
});

// ----------------------- ROUTES -----------------------

// Health check
app.get('/', (req, res) => {
  res.json({ status: "OK", service: "RecipeHub API" });
});

app.get('/health', (req, res) => {
  res.json({ system: "healthy", time: Date.now() });
});

// ----------------------- GET ALL RECIPES -----------------------
app.get('/recipes', (req, res) => {
  db.query('SELECT * FROM recipes', (err, results) => {
    if (err) return res.status(500).json({ error: "DB query failed" });
    res.json(results);
  });
});

// ----------------------- ADD RECIPE -----------------------
app.post('/recipes', upload.single('image'), (req, res) => {
  const { title, category, prepTime, servings, description, ingredients, instructions } = req.body;

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  const sql = `INSERT INTO recipes 
      (title, category, prep_time, servings, description, ingredients, instructions, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

  db.query(sql, [
    title,
    category,
    prepTime || 0,
    servings || 0,
    description || '',
    typeof ingredients === 'string' ? ingredients : JSON.stringify(ingredients || []),
    typeof instructions === 'string' ? instructions : JSON.stringify(instructions || []),
    imageUrl
  ], (err, result) => {
    if (err) return res.status(500).json({ error: "Insert failed" });
    res.json({ message: "Recipe added!", id: result.insertId });
  });
});

// ----------------------- SIGNUP -----------------------
app.post('/signup', async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password)
    return res.status(400).json({ error: "Missing fields" });

  const hashed = await bcrypt.hash(password, 10);

  db.query(
    "INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)",
    [fullName, email, hashed],
    (err) => {
      if (err) return res.status(500).json({ error: "Email already exists" });
      res.json({ message: "Signup successful!" });
    }
  );
});

// ----------------------- LOGIN -----------------------
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) return res.status(500).json({ error: "DB error" });
    if (results.length === 0) return res.status(401).json({ error: "Invalid credentials" });

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    res.json({ message: "Login success", user });
  });
});

// ----------------------- DELETE RECIPE -----------------------
app.delete('/recipes/:id', (req, res) => {
  db.query("DELETE FROM recipes WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: "Delete failed" });
    res.json({ message: "Recipe deleted" });
  });
});

// ----------------------- UPDATE RECIPE -----------------------
app.put('/recipes/:id', upload.single('image'), (req, res) => {
  const updates = [];
  const values = [];

  const fields = ["title", "category", "prepTime", "servings", "description", "ingredients", "instructions"];
  fields.forEach(field => {
    if (req.body[field]) {
      updates.push(`${field} = ?`);
      values.push(req.body[field]);
    }
  });

  if (req.file) {
    updates.push("image_url = ?");
    values.push(`/uploads/${req.file.filename}`);
  }

  if (updates.length === 0)
    return res.status(400).json({ error: "No updates provided" });

  values.push(req.params.id);

  const sql = `UPDATE recipes SET ${updates.join(", ")} WHERE id = ?`;

  db.query(sql, values, (err) => {
    if (err) return res.status(500).json({ error: "Update failed" });
    res.json({ message: "Recipe updated" });
  });
});

// ----------------------- START SERVER -----------------------
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running at port ${PORT}`);
});
