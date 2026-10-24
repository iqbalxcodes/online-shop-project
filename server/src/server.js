require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB terhubung'))
    .catch(err => { console.error('Mongo error:', err.message); process.exit(1); });
//Router
const usersRouter = require('./routes/users');
app.use('/api/users', usersRouter);

app.get('/', (_, res) => res.send('API OK'));

// Error handler
app.use((err, req, res, next) => {
    console.error(err);

    const code = err.code === 11000 ? 409 : (err.status || 500);
    res.status(code).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server berjalan di http://localhost:${PORT}`))