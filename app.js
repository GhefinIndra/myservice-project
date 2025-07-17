const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors'); // Import CORS


const app = express();
const PORT = 3000;
const path = require('path');

// Enable CORS for all routes
app.use(cors());

// Serve static files (HTML, CSS, JS) from the 'public' folder
app.use(express.static(path.join(__dirname)));

// Middleware to read data from HTML form
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// MySQL database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '26Desember!',
  database: 'myservice', 
});

db.connect((err) => {
  if (err) {
    console.error('Failed to connect to database:', err.message);
  } else {
    console.log('Connected to the database!');
  }
});



// Handle login request (without bcrypt)
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  const query = 'SELECT * FROM `user` WHERE email = ? AND password = ?';
  db.query(query, [email, password], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (results.length > 0) {
      // Successful login, respond with success
      res.json({
        user_id: results[0].user_id,   // Send the user_id back
      });
    } else {
      // Failed login, send error message
      res.json({ message: 'Email atau password salah.' });
    }
  });
});

// Handle signup request (no hashing)
// Bagian ini digunakan untuk bagian signup
app.post('/signup', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Username, email, and password are required.' });
  }

  const checkQuery = 'SELECT * FROM `user` WHERE email = ?';
  db.query(checkQuery, [email], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (results.length > 0) {
      return res.json({ message: 'Email sudah terdaftar.' });
    }

    const insertQuery = 'INSERT INTO `user` (username, email, password) VALUES (?, ?, ?)';
    db.query(insertQuery, [username, email, password], (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({ success: true });
    });
  });
});

// Retrieve user data by user_id, ini untuk menampilkan data pada halaman profil
// Bagian ini digunakan pada halaman profil untuk menampilkan data yang ada di database
app.get('/getUserData/:user_id', (req, res) => {
  const userId = req.params.user_id;

  const query = 'SELECT * FROM `user` WHERE user_id = ?';
  db.query(query, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (results.length > 0) {
      const user = results[0];
      res.json({
        name: user.username,
        email: user.email,
        birthdate: user.birthdate,
        phone: user.phone_number,
        sex: user.sex,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  });
});

// Update user data diperuntukkan pada saat input data baru di halaman profil
// Bagian ini digunakan pada  halaman profil untuk edit data pengguna
app.put('/updateUserData', (req, res) => {
  const { user_id, name, email, birthdate, phone, sex } = req.body;

  if (!user_id) {
      return res.status(400).json({ message: 'User ID is required.' });
  }

  const query = `
      UPDATE user 
      SET 
          username = COALESCE(?, username), 
          email = COALESCE(?, email), 
          birthdate = COALESCE(?, birthdate), 
          phone_number = COALESCE(?, phone_number), 
          sex = COALESCE(?, sex) 
      WHERE user_id = ?`;

  db.query(
      query,
      [name, email, birthdate, phone, sex, user_id],
      (err, result) => {
          if (err) {
              return res.status(500).json({ error: err.message });
          }
          res.json({ success: true, message: 'Profile updated successfully.' });
      }
  );
});

// Menyimpan kerusakan yang akan dimasukkan ke database
app.post('/saveDamage', (req, res) => {
  const { user_id, chat_name, date } = req.body;

  if (!user_id || !chat_name || !date) {
    console.error('Invalid input:', req.body);
    return res.status(400).json({ message: 'User ID, chat_name, dan date harus diisi.' });
  }

  const query = 'INSERT INTO chat (user_id, chat_name, date) VALUES (?, ?, ?)';
  db.query(query, [user_id, chat_name, date], (err, results) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({ message: 'Terjadi kesalahan di server.' });
    }
    res.json({ success: true, message: 'Kerusakan berhasil disimpan.' });
  });
});

// Mendapatkan riwayat kerusakan berdasarkan user_id (yang akan muncul di halaman HistoriKerusakan)
app.get('/getDamageHistory/:user_id', (req, res) => {
  const userId = req.params.user_id;

  const query = 'SELECT * FROM `chat` WHERE user_id = ? ORDER BY DATE DESC';
  db.query(query, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (results.length > 0) {
      res.json(results);
    } else {
      res.json({ message: 'Tidak ada riwayat kerusakan.' });
    }
  });
});

// Memasukan data input ke database
// Bagian ini digunakan untuk upload username, email, dan pesan pada halaman contact us
app.post('/saveMessage', (req, res) => {
  const { user_id, name, email, message } = req.body;

  if (!user_id || !name || !email || !message) {
      return res.status(400).json({ message: 'Semua kolom harus diisi.' });
  }

  const query = 'INSERT INTO contact (user_id, name, email, message) VALUES (?, ?, ?, ?)';
  db.query(query, [user_id, name, email, message], (err, results) => {
      if (err) {
          return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, message: 'Pesan berhasil disimpan.' });
  });
});


// Menyalakan server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
