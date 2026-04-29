const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');

router.post('/signup',async (req,res,next)=>{
    try{
    
        const {email,password,name} = req.body;

        if(!email || !password || !name){
            return res.status(400).json({error: "Email, password and name are required"})
        }

        if(!validator.isEmail(email)){
            return res.status(400).json({error:"The email address is not valid!"});  
        }
        if(password.length<8){
            return res.status(400).json({error:"Password must at least 8 characters"});
        }

        const {rows} = await pool.query(`
                SELECT email 
                FROM users 
                WHERE email = $1
            `,[email]);
        
        if(rows.length!=0){
            return res.status(400).json({error: "Email is already in use!"});
        }

        const saltRounds = parseInt(process.env.SALT_ROUNDS,10) || 10;
        const password_hash = await bcrypt.hash(password,saltRounds);

        await pool.query(`
            INSERT INTO users(email,password_hash,name)
            VALUES ($1,$2,$3)
        `,[email,password_hash,name]);
        
        res.status(201).json({message:'Sign up successful!'})

    }catch(err){
        console.error(err);
        res.status(500).json({error: 'server error'});
    }

});
router.post('/login', async (req,res,next)=>{
    
    try{
        const {email,password} = req.body;

        if(!email || !password){
            return res.status(400).json({error: 'Email and password are required'});
        }

        const {rows} = await pool.query(`
            SELECT id,email,password_hash,name
            FROM users
            WHERE email = $1;`,[email]);

        if(rows.length==0){
            return res.status(401).json({error: 'Invalid credentials'});
        }
        const user = rows[0];
        const match = await bcrypt.compare(password,user.password_hash);

        if(!match){
            return res.status(401).json({error: 'Invalid credentials'});
        }

        const token = jwt.sign({id:user.id,name:user.name},process.env.JWT_SECRET,{expiresIn: '1h'});

        res.cookie('token',token,{
            httpOnly: true,
            secure: process.env.NODE_ENV==='production',
            sameSite: process.env.NODE_ENV==='production' ? 'none' : 'strict',
            maxAge: 3600000
        });
        res.json({ message: 'Logged in', name:user.name});

    }
    catch(err){
        console.error(err);
        res.status(500).json({error: 'Server Error'})
    }
});

router.post('/logout', (req, res) => {

    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
    });
    res.json({message: 'Logged Out'});   


});



module.exports = router;
