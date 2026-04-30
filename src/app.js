require('dotenv').config();

const express = require('express');
const path = require('path');
const app = express();
const cookieParser = require('cookie-parser');
const cors = require('cors');
const PORT = parseInt(process.env.PORT,10) || 3000;


// app.set('view engine', 'ejs');
// app.set('views', path.join(__dirname, 'views'));

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
}))
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());



const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

const logsRoutes = require('./routes/logs');
app.use('/logs', logsRoutes);

const tagsRoutes = require('./routes/tags');
app.use('/tags', tagsRoutes);

const summaryRoutes = require('./routes/summary');
app.use('/summary', summaryRoutes);

if (process.env.NODE_ENV === 'development') {
    const { createTables } = require('./db/schema');
    createTables().catch(console.error);
}

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`timelog server has started on port ${PORT}`);
    });
}

module.exports = app;
