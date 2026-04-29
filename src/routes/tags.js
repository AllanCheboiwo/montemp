const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

const authenticate = require('../middleware/auth');

router.use(authenticate);

router.post('/',async (req,res)=>{
    try{
        const tag = req.body;
        if(!tag.name){
            return res.status(400).json({message:"Invalid inputs"});
        }
        const {rows} = await pool.query(
            `
             INSERT INTO tags(user_id,name,color)
             VALUES ($1,$2,$3)
             RETURNING id,name,color;
            `
        ,[req.user.id,tag.name,tag.color]);

        res.status(201).json({"id":rows[0].id,name:rows[0].name,color:rows[0].color});
    }
    catch(err){
        console.error(err);
        res.status(500).json({message:"failed"})

    }

});
router.get('/',async (req,res)=>{

    try{

        const {rows} = await pool.query(
            `
            SELECT id,name,color
            FROM tags
            WHERE user_id = $1
            `
        ,[req.user.id]);

        res.status(200).json(rows);
    }catch(err){
        console.error(err);
        res.status(500).json({message:"Getting tags failed"});
    }

});

router.delete('/:id',async (req,res)=>{

    try{
        await pool.query(`
                DELETE FROM tags
                WHERE id = $1 AND user_id=$2
            `,[req.params.id,req.user.id]);
        
        res.status(204).send();

    }catch(err){
        console.error(err);
        res.status(500).json({message:"Failed to delete tag"});
    }

});


module.exports = router;
