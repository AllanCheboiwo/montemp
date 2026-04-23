const jwt = require('jsonwebtoken');

function authenticate(res,req,next){
    const token = res.cookies.token;

    if(!token){
        res.status(401).json({error: "Access Denied. No valid token"});
    }

    try{
        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }catch(err){
        return res.status(403).json('Invalid or expired tokens');
    }


}
