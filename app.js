"use strict";

require("dotenv").load();
const express = require("express");
const path = require("path");
const app = express();
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const User = require("./model");
const trans = require("./model_trans");
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(helmet());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "views")));
const mongoose = require("mongoose");
app.use(
  cors({
    // origin:'http://localhost:3000'
  })
);
const Razorpay = require("razorpay");
const Port = process.env.PORT || 3500;
const instance = new Razorpay({
  key_id: process.env.RZP_KEY_ID,
  key_secret: process.env.RZP_KEY_SECRET,
});

async function run() {
  try {
    await mongoose.connect(
      "mongodb+srv://student:qwerty123@cluster0.801etc0.mongodb.net/?retryWrites=true&w=majority",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log("Connected to DB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

run();

app.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

app.get("/api/v1/rzp_capture/:payment_id/:amount", (req, res) => {
  const { payment_id } = req.params;
  const amount = Number(req.params.amount * 100);
  instance.payments
    .capture(payment_id, amount)
    .then((data) => {
      res.json(data);
    })
    .catch((error) => {
      res.json(error);
    });
});

app.get("/api/v1/rzp_refunds/:payment_id", (req, res) => {
  const { payment_id } = req.params;
  instance.payments
    .refund(payment_id)
    .then((data) => {
      res.json(data);
    })
    .catch((error) => {
      res.json(error);
    });
});

app.post("/prompt", async (req, res) => {
  try {
    let id = req.body.rno;
    console.log(id);
    let data = await User.find({ Rollno: id });
    console.log(data);
    if (data.length === 0) {
      return res.json({
        Success: false,
        errors: "No Roll Number Exists",
      });
    } else {
      return res.json({
        prompt: data[0].Prompt,
      });
    }
  } catch (err) {
    console.log(err);
    res.json({ Success: false });
  }
});

app.post("/login", async (req, res) => {
  try {
    let id = req.body.rno;
    let pass = req.body.pass;
    console.log(id);
    let data = await User.find({ Rollno: id });
    console.log(data);
    if (data.length === 0) {
      return res.json({
        Success: false,
        errors: "No Roll Number Exists",
      });
    } else {
      if (data[0].Pass === pass) {
        res.json({ Success: true });
      } else {
        res.json({
          Success: false,
          Error: "Wrong Password",
        });
      }
    }
  } catch (err) {
    console.log(err);
    res.json({ Success: false });
  }
});

app.post("/send_details", async (req, res) => {
  try {
    await User.create({
      name: req.body.name,
      rno: req.body.rno,
      phno: req.body.phno,
      id: req.body.id,
      uniqkey: req.body.uniqKey,
      entry: req.body.entry,
    });
    res.json({ Success: true });
  } catch (err) {
    console.log(err);
    res.json({ Success: false });
  }
});

app.post("/verify", async (req, res) => {
  try {
    let uid = req.body.t_id;
    console.log(uid);
    let trans_check = await trans.find({ t_id: uid });
    let data = await User.find({ TransactionId: uid });
    console.log(trans_check);
    if (trans_check.length === 0) {
      return res.json({
        Success: false,
        errors: "Given Student didn't register",
      });
    }

    if (data[0].Entry === true) {
      return res.json({ Success: false, errors: "QR already scanned" });
    } else {
      await User.updateOne(
        { TransactionId: uid },
        {
          $set: {
            Rollno: data[0].Rollno,
            Name: data[0].Name,
            Phoneno: data[0].Phoneno,
            Year: data[0].Year,
            Parent: data[0].Parent,
            Prompt: data[0].Prompt,
            Pass: data[0].Pass,
            TransactionId: data[0].TransactionId,
            Entry: true,
            Paid: data[0].Paid,
          },
        }
      );
      res.json({ Success: true, rno: data[0].Rollno });
    }
  } catch (err) {
    console.log(err);
    res.json({ Success: false ,Error:err});
  }
});

app.post("/put_id", async (req, res) => {
  try {
    let id = req.body.rno;
    let key = req.body.t_id;

    let data = await User.find({ Rollno: id });
    console.log(data);
    if (data.length === 0) {
      return res.json({
        Success: false,
        errors: "Given Student didn't register",
      });
    }

    if (data[0].paid) {
      return res.json({ Success: false, errors: "Already paid" });
    } else {
      await User.updateOne(
        { Rollno: id },
        {
          $set: {
            Rollno: data[0].Rollno,
            Name: data[0].Name,
            Phoneno: data[0].Phoneno,
            Year: data[0].Year,
            Parent: data[0].Parent,
            Prompt: data[0].Prompt,
            Pass: data[0].Pass,
            TransactionId: key,
            Entry: data[0].Entry,
            Paid: true,
          },
        }
      );
      res.json({ Success: true });
    }
  } catch (err) {
    console.log(err);
    res.json({ Success: false });
  }
});

app.listen(Port, () => console.log("Listening on port"));
