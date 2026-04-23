const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/auth');

routers.use(authenticate);

router.get('/summary',(req,res,next)=>{

});



module.exports = router;
