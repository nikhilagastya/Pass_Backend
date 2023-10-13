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

app.post("/get_details", async (req, res) => {
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
      res.json({
        Success: true,
        Rollno: data[0].Rollno,
        Name: data[0].Name,
        TransactionId: data[0].TransactionId,
        Prompt: data[0].Prompt,
      });
    }
  } catch (err) {
    console.log(err);
    res.json({ Success: false });
  }
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
        errors: "Fake QR detected",
      });
    }

    if (data[0].Entry === true) {
      return res.json({
        Success: false,
        errors: "QR already scanned",
        rno: data[0].Rollno,
      });
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
    res.json({ Success: false, Error: err, rno: data[0].Rollno });
  }
});

app.get("/countYear", async (req, res) => {
  try {
    const count1 = await User.countDocuments({ Year: 1, Paid: true });
    const count2 = await User.countDocuments({ Year: 2, Paid: true });
    const count3 = await User.countDocuments({ Year: 3, Paid: true });
    const count4 = await User.countDocuments({ Year: 4, Paid: true });
    res.json({ 1: count1, 2: count2, 3: count3, 4: count4 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "An error occurred while counting year." });
  }
});

app.post("/checkpasscount", async (req, res) => {
  try {
    console.log(req.body.Year);
    const cur_year = Number(req.body.Year);

    const count = await User.countDocuments({ Year: cur_year, Paid: true });

    if (isNaN(cur_year)) {
      res.status(400).json({ error: "Invalid year parameter" });
      return;
    }

    if (cur_year == 1) {
      if (count >= 450) {
        res
          .status(404)
          .json({ error: "Sorry!! We are out of Passes for 1st years " });
      } else {
        res.status(200).json({ success: true });
      }
    }
    if (cur_year == 2) {
      if (count >= 450) {
        res
          .status(404)
          .json({ error: "Sorry!! We are out of Passes for 2nd years " });
      } else {
        res.status(200).json({ success: true });
      }
    }
    if (cur_year == 3) {
      if (count >= 450) {
        res
          .status(404)
          .json({ error: "Sorry!! We are out of Passes for 3rd years " });
      } else {
        res.status(200).json({ success: true });
      }
    }
    if (cur_year == 4) {
      if (count >= 450) {
        res
          .status(404)
          .json({ error: "Sorry!! We are out of Passes for 4th years " });
      } else {
        res.status(200).json({ success: true });
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "An error occurred while counting " });
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
    let trans_data = await User.find({ TransactionId: key });
    console.log(trans_data)
    if (trans_data.length != 0) {
      return res.json({
        Success: false,
        errors: "Transaction ID already exists",
      });
    }

    if (data[0].Paid) {
      return res.json({ Success: false, errors: "Already Paid" });
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
