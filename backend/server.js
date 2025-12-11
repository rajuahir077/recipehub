// server.js - cleaned & ready for Render
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');

const app = express();
// single port declaration (important)
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer (file uploads) - note: Render filesystem is ephemeral (uploads won't persist)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// ---------- DATABASE CONNECTION ----------
// Accept common env var names: MYSQL_URL (Railway/Render) or DB_URL (custom)
const dbUrl = process.env.MYSQL_URL || process.env.DB_URL || null;

let db;
if (dbUrl) {
  // mysql2 accepts a connection string like mysql://user:pass@host:port/db
  db = mysql.createConnection(dbUrl);
  console.log('Using database URL from environment.');
} else {
  // local fallback for development only
  db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '03062001@Raju', // <-- remove or move to .env in real projects
    database: 'recipehub'
  });
  console.log('Using local MySQL config.');
}

db.connect(err => {
  if (err) {
    console.error('❌ Database connection failed:', err);
  } else {
    console.log('✅ Connected to MySQL database.');
  }
});

// ---------- ROUTES ----------

// GET all recipes
app.get('/recipes', (req, res) => {
  db.query('SELECT * FROM recipes', (err, results) => {
    if (err) {
      console.error('❌ Error fetching recipes:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json(results);
  });
});

// POST add recipe (with optional image)
app.post('/recipes', upload.single('image'), (req, res) => {
  const {
    title, category, prepTime, servings, description, ingredients, instructions
  } = req.body;

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  const sql = `INSERT INTO recipes 
    (title, category, prep_time, servings, description, ingredients, instructions, image_url) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

  db.query(
    sql,
    [
      title,
      category,
      prepTime || 0,
      servings || 0,
      description || '',
      typeof ingredients === 'string' ? ingredients : JSON.stringify(ingredients || []),
      typeof instructions === 'string' ? instructions : JSON.stringify(instructions || []),
      imageUrl
    ],
    (err, result) => {
      if (err) {
        console.error('❌ Error inserting recipe:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      res.json({ message: '✅ Recipe added successfully!', id: result.insertId });
    }
  );
});

// Signup
app.post('/signup', async (req, res) => {
  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.query(
      'INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)',
      [fullName, email, hashedPassword],
      (err, result) => {
        if (err) {
          console.error('❌ Signup error:', err);
          return res.status(500).json({ error: 'Email already exists or other error.' });
        }
        res.json({ message: '✅ User registered successfully!' });
      }
    );
  } catch (err) {
    console.error('❌ Hashing error:', err);
    res.status(500).json({ error: 'Signup failed!' });
  }
});

// Login
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) {
      console.error('❌ Login error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    if (results.length === 0) return res.status(401).json({ error: 'Invalid email or password.' });

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      res.json({ message: '✅ Login successful!', user: { id: user.id, fullName: user.full_name, email: user.email } });
    } else {
      res.status(401).json({ error: 'Invalid email or password.' });
    }
  });
});

// DELETE recipe
app.delete('/recipes/:id', (req, res) => {
  const recipeId = req.params.id;
  db.query('DELETE FROM recipes WHERE id = ?', [recipeId], (err) => {
    if (err) {
      console.error('❌ Error deleting recipe:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json({ message: '✅ Recipe deleted successfully' });
  });
});

// UPDATE recipe
app.put('/recipes/:id', upload.single('image'), (req, res) => {
  const recipeId = req.params.id;
  const { title, category, prepTime, servings, description, ingredients, instructions } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  const updateFields = [];
  const values = [];

  if (title) { updateFields.push('title = ?'); values.push(title); }
  if (category) { updateFields.push('category = ?'); values.push(category); }
  if (prepTime !== undefined) { updateFields.push('prep_time = ?'); values.push(prepTime); }
  if (servings !== undefined) { updateFields.push('servings = ?'); values.push(servings); }
  if (description !== undefined) { updateFields.push('description = ?'); values.push(description); }
  if (ingredients !== undefined) { updateFields.push('ingredients = ?'); values.push(typeof ingredients === 'string' ? ingredients : JSON.stringify(ingredients)); }
  if (instructions !== undefined) { updateFields.push('instructions = ?'); values.push(typeof instructions === 'string' ? instructions : JSON.stringify(instructions)); }
  if (imageUrl) { updateFields.push('image_url = ?'); values.push(imageUrl); }

  if (updateFields.length === 0) return res.status(400).json({ error: 'No fields to update.' });

  const sql = `UPDATE recipes SET ${updateFields.join(', ')} WHERE id = ?`;
  values.push(recipeId);

  db.query(sql, values, (err) => {
    if (err) {
      console.error('❌ Error updating recipe:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json({ message: '✅ Recipe updated successfully!' });
  });
});

// GET single recipe by id
app.get('/recipes/:id', (req, res) => {
  const recipeId = req.params.id;
  db.query('SELECT * FROM recipes WHERE id = ?', [recipeId], (err, results) => {
    if (err) {
      console.error('❌ Error fetching recipe:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    if (!results || results.length === 0) return res.status(404).json({ error: 'Recipe not found' });

    const recipe = results[0];

    // safe JSON parse
    let ingredients = [];
    let instructions = [];
    try {
      ingredients = JSON.parse(recipe.ingredients || '[]');
      instructions = JSON.parse(recipe.instructions || '[]');
    } catch (parseErr) {
      console.error('❌ JSON parsing error in ingredients/instructions:', parseErr);
      return res.status(500).json({ error: 'Corrupted ingredients or instructions format' });
    }

    res.json({
      id: recipe.id,
      title: recipe.title,
      category: recipe.category,
      prep_time: recipe.prep_time,
      servings: recipe.servings,
      description: recipe.description,
      ingredients,
      instructions,
      image_url: recipe.image_url
    });
  });
});

// Start server (only once)
app.listen(PORT, () => {
  console.log(`🚀 Server running at: http://localhost:${PORT}`);
});
