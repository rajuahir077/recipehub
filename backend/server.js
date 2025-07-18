const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure Multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '03062001@Raju',
  database: 'recipehub'
});

db.connect(err => {
  if (err) {
    console.error('❌ Database connection failed:', err.stack);
    return;
  }
  console.log('✅ Connected to MySQL database.');
});

// Get all recipes
app.get('/recipes', (req, res) => {
  db.query('SELECT * FROM recipes', (err, results) => {
    if (err) {
      console.error('❌ Error fetching recipes:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json(results);
  });
});

// Add a new recipe with image upload
app.post('/recipes', upload.single('image'), (req, res) => {
  const {
    title,
    category,
    prepTime,
    servings,
    description,
    ingredients,
    instructions
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
      prepTime,
      servings,
      description,
      JSON.stringify(ingredients),
      JSON.stringify(instructions),
      imageUrl
    ],
    (err, result) => {
      if (err) {
        console.error('❌ Error inserting recipe:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json({ message: '✅ Recipe added successfully!', id: result.insertId });
      }
    }
  );
});

// Signup Route
app.post('/signup', async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const full_name = fullName;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      'INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)',
      [full_name, email, hashedPassword],
      (err, result) => {
        if (err) {
          console.error('❌ Signup error:', err);
          return res.status(500).json({ error: 'Email already exists or other error.' });
        }
        res.json({ message: '✅ User registered successfully!' });
      }
    );
  } catch (error) {
    console.error('❌ Hashing error:', error);
    res.status(500).json({ error: 'Signup failed!' });
  }
});

// Login Route
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) {
      console.error('❌ Login error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      res.json({
        message: '✅ Login successful!',
        user: { id: user.id, fullName: user.full_name, email: user.email }
      });
    } else {
      res.status(401).json({ error: 'Invalid email or password.' });
    }
  });
});

//delete recipe
app.delete('/recipes/:id', (req, res) => {
  const recipeId = req.params.id;
  const sql = 'DELETE FROM recipes WHERE id = ?';

  db.query(sql, [recipeId], (err, result) => {
    if (err) {
      console.error('❌ Error deleting recipe:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json({ message: '✅ Recipe deleted successfully' });
  });
});

// Update an existing recipe by ID
app.put('/recipes/:id', upload.single('image'), (req, res) => {
  const recipeId = req.params.id;
  const {
    title,
    category,
    prepTime,
    servings,
    description,
    ingredients,
    instructions
  } = req.body;

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  const updateFields = [];
  const values = [];

  if (title) { updateFields.push('title = ?'); values.push(title); }
  if (category) { updateFields.push('category = ?'); values.push(category); }
  if (prepTime) { updateFields.push('prep_time = ?'); values.push(prepTime); }
  if (servings) { updateFields.push('servings = ?'); values.push(servings); }
  if (description) { updateFields.push('description = ?'); values.push(description); }
  if (ingredients) { updateFields.push('ingredients = ?'); values.push(JSON.stringify(ingredients)); }
  if (instructions) { updateFields.push('instructions = ?'); values.push(JSON.stringify(instructions)); }
  if (imageUrl) { updateFields.push('image_url = ?'); values.push(imageUrl); }

  if (updateFields.length === 0) {
    return res.status(400).json({ error: 'No fields to update.' });
  }

  const sql = `UPDATE recipes SET ${updateFields.join(', ')} WHERE id = ?`;
  values.push(recipeId);

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('❌ Error updating recipe:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json({ message: '✅ Recipe updated successfully!' });
  });
});

  /**Added Part */
  // Get a single recipe by ID
// Improved GET /recipes/:id route with correct column names
app.get('/recipes/:id', (req, res) => {
  const recipeId = req.params.id;

  db.query('SELECT * FROM recipes WHERE id = ?', [recipeId], (err, results) => {
    if (err) {
      console.error('❌ Error fetching recipe:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    const recipe = results[0];

    let ingredients = [];
    let instructions = [];

    try {
      ingredients = JSON.parse(recipe.ingredients || '[]');
      instructions = JSON.parse(recipe.instructions || '[]');
    } catch (error) {
      console.error('❌ JSON parsing error in ingredients/instructions:', error);
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




app.listen(port, () => {
  console.log(`🚀 Server running at: http://localhost:${port}`);
});
