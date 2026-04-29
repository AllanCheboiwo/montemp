const express = require('express');
const router = express.Router();
const pool = require("../db/pool");

const authenticate = require('../middleware/auth');

router.use(authenticate);

router.get('/',async (req,res)=>{
    const range = req.query

    if(!range.from||!range.to){
        return res.status(400).json({message:"time range is incorrect"});
    }

    try{

        const {rows} = await pool.query(`
            SELECT 
                tags.id AS tag_id,
                tags.name AS tag_name,
                tags.color AS tag_color,
                ROUND(SUM(EXTRACT(EPOCH FROM (end_time - start_time)) / 3600)::numeric, 2) AS total_hours
            FROM time_logs
            JOIN tags ON tags.id = time_logs.tag_id
            WHERE time_logs.user_id = $3
            AND time_logs.start_time >= $1
            AND time_logs.start_time <= $2
            GROUP BY tags.id, tags.name, tags.color;
            `,[range.from,range.to,req.user.id]);

        res.status(200).json(rows);
    }catch(err){
        console.error(err);
        res.status(500).json({message:"Failed to get summary"});
    }


    

});



module.exports = router;
