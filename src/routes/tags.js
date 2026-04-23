const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

const authenticate = require('../middleware/auth');

routers.use(authenticate);

router.post('/tags',async (req,res,next)=>{
    try{
        await pool.query(
            `
             INSERT INTO 
            `
        )
    }
    catch(err){

    }

});
router.get('/tags',(req,res,next)=>{


});

router.delete('/tags/:id',(req,res,next)=>{

});


module.exports = router;
