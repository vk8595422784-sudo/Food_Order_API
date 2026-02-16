import Food from '../models/food.js'


export const getFood = async (req, res)=>{
  const filter = {}

  if(req.query.category) filter.category = req.query.category
  if(req.query.available) filter.available = req.query.available === "true"

  const foods = await Food.find(filter)

  res.json({
    status:"success",
    data: foods,
    message: "food fetched"
  })
}

export const createFood = async (req,res)=>{
  if(req.user.role !== "admin"){
    return res
    .status(403)
    .json({status:"fail", data: null, message: "Admin only"})
  }

  const {name, price} = req.body

  if(!name || !price){
    return res
    .status(400)
    .json({status:"fail",data: null, message: "Missing field"})
  }

  const food = Food.create(req.body)
  res.json({
    status: "success",
    data: food,
    message: "Food Created"
  })
}

export const updateFood = async (req,res)=>{
  if(req.user.role !== "admin"){
    return res
    .status(403)
    .json({ status: "fail", data: null, message: "Admin Only"})
  }

  const food = await Food.findByIdAndUpdate(req.params.id, req.body,{new:true})

  res.json({
    status:"success",
    data: food,
    message: "Food Updated"
  })
}


export const deleteFood = async (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ status: "fail", data: null, message: "Admin Only" });
  }
  await Food.findByIdAndDelete(req.params.id);

  res.json({
    status: "success",
    data: null,
    message: "Food Deleted",
  });
};