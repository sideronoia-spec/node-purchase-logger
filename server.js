import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_URI)
  .then(()=>console.log("MongoDB Connected"))
  .catch(err=>console.log(err));

const expenseSchema = new mongoose.Schema({
  date: String,
  amount: Number
});

const Expense = mongoose.model("Expense", expenseSchema);

app.post("/add", async (req,res)=>{
  const { date, amount } = req.body;
  await Expense.updateOne({ date }, { date, amount }, { upsert:true });
  res.redirect("/");
});

app.get("/expenses", async (req,res)=>{
  const expenses = await Expense.find().sort({date:-1});
  res.json(expenses);
});

app.get("/delete/:id", async (req,res)=>{
  await Expense.findByIdAndDelete(req.params.id);
  res.redirect("/");
});

app.listen(8080, ()=>console.log("Server running on 8080"));
