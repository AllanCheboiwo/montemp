require('dotenv').config();

const express = require('express');
const path = require('path');
const pool = require('./db/pool');
const app = express();
const cookieParser = require('cookie-parser');
const PORT = parseInt(process.env.PORT,10);

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());

// app.use(express.static(path.join(__dirname, 'public')));


app.listen(PORT,()=>{
    console.log(`timelog server has started on port ${PORT}`);
});
