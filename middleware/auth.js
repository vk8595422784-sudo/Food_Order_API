import User from '../models/user.js'
import jwt from 'jsonwebtoken'

export const auth = async (req,res,next)=>{
  try {
    const authHeader = req.headers.authorization
    if(!authHeader || !authHeader.startsWith("Bearer ")){
      return res.status(401).json({
      status: "fail",
      message:"Token not found or unauthorized user"
      })
    }
    const token = authHeader.split(" ")[1]
    if(!token){
        return res.status(401).json({
          status: "fail",
          message: "Token not found"
        })
    }

    const decode = jwt.verify(token,process.env.JWT_SECRET)
    if(!decode || !decode._id) {
      return res.status(401).json({
          status: "fail",
          message: "Token not valid"
        })
    } 

    const user = await User.findById(decode._id).select("-password")
    if(!user){
      return res.status(401).json({
          status: "fail",
          message: "User no loger exist"
        })
    }
    req.user = user
    next()

  } catch (error) {
    return res.status(401).json({
          status: "fail",
          message: "Verification fail"
        })
  }
}

export default auth
