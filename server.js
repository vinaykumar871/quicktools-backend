import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Groq from "groq-sdk";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// VERY IMPORTANT
app.options("*", cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend is working 🚀");
});

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

/* ================= AI QUIZ ================= */
app.post("/generate-quiz", async (req, res) => {
  console.log("🔥 Quiz API called");

  let text = "";

  try {
    const { topic, level } = req.body;

    const prompt = `
Generate 50 placement-level MCQs for ${topic} (${level}).

Rules:
- Questions should be useful for companies like TCS, Infosys, Accenture
- Include mix of easy, medium, hard
- Return ONLY JSON

Format:
[
{"q":"Question","options":["A","B","C","D"],"answer":"A"}
]
`;

    const r = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
    });

    // ✅ assign AFTER API call
    text = r.choices[0].message.content;

  } catch (err) {
    console.log("❌ GROQ ERROR:", err);

    // ✅ fallback if API fails
    return res.json({
      questions: [
        {
          q: "Fallback: 2 + 2 = ?",
          options: ["2", "3", "4", "5"],
          answer: "4"
        }
      ]
    });
  }

  // ✅ safety check AFTER assignment
  if (!text) {
    return res.json({
      questions: [
        {
          q: "Fallback: API returned empty response",
          options: ["Retry", "Reload", "Check server", "Wait"],
          answer: "Retry"
        }
      ]
    });
  }

  // ✅ clean AI output
  text = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .replace(/\n/g, "")
    .trim();

  if (!text.endsWith("]")) {
    text += "]";
  }

  let questions;

  try {
    questions = JSON.parse(text);
  } catch (e) {
    console.log("❌ JSON ERROR:", text);

    // ✅ fallback if JSON fails
    questions = [
      {
        q: "Fallback: 10 + 5 = ?",
        options: ["10", "15", "20", "25"],
        answer: "15"
      }
    ];
  }

  // ✅ FINAL RESPONSE
  res.json({ questions });
});

  // 🔽 NOW PARSE JSON (SECOND BLOCK)
  text = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .replace(/\n/g, "")
    .trim();

  if (!text.endsWith("]")) {
    text += "]";
  }

  let questions;

  try {
    questions = JSON.parse(text);
  } catch (e) {
    console.log("❌ JSON ERROR:", text);

    questions = [
      {
        q: "Fallback: 10 + 5 = ?",
        options: ["10","15","20","25"],
        answer: "15"
      }
    ];
  }

  res.json({ questions });


/* ================= AI EXPLANATION ================= */
app.post("/explain", async (req, res) => {
  try {
    const { question, answer } = req.body;

    const r = await groq.chat.completions.create({
      messages: [{
        role: "user",
        content: `Explain simply:\nQ: ${question}\nAns: ${answer}`
      }],
      model: "llama-3.1-8b-instant",
    });

    res.json({ explanation: r.choices[0].message.content });

  } catch {
    res.json({ explanation: "Error" });
  }
});



// =========================
// ✅ DB CONNECT
// =========================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.log("❌ DB ERROR:", err));

// =========================
// ✅ MODELS
// =========================
const User = mongoose.model("User", {
  username: String,
  password: String
});

const Contact = mongoose.model("Contact", {
  name: String,
  email: String,
  message: String,
  createdAt: { type: Date, default: Date.now }
});

// =========================
// 📩 MAIL SETUP
// =========================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "quicktoolsstudent@gmail.com",
    pass: "eadj pcot gqgr ppcs"
  }
});



// =========================
// 🤖 UNIVERSAL AI (FIXED)
// =========================
app.post("/ai", async (req, res) => {
  try {
    const { text, type } = req.body;

    if (!text) {
      return res.json({ result: "Please enter text" });
    }

    let prompt = "";

    if (type === "grammar") prompt = `Fix grammar: ${text}`;
    else if (type === "formal") prompt = `Rewrite formally: ${text}`;
    else if (type === "casual") prompt = `Rewrite casually: ${text}`;
    else if (type === "professional") prompt = `Rewrite professionally: ${text}`;
    else if (type === "paraphrase") prompt = `Paraphrase: ${text}`;
    else prompt = text;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
    });

    res.json({
      result: completion.choices[0].message.content
    });

  } catch (err) {
    console.log(err);
    res.json({ result: "AI failed" });
  }
});

// =========================
// 🤖 ATS CHECK API
// =========================
app.post("/ats-check", async (req, res) => {
  try {
    const { resumeText, jobDesc } = req.body;

    if (!resumeText) {
      return res.json({ result: "⚠ Resume text missing" });
    }

    const prompt = `
ATS Score format:

ATS Score: XX/100

- Missing Keywords
- Improvements

Resume:
${resumeText}

Job Description:
${jobDesc}
`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
    });

    res.json({ result: completion.choices[0].message.content });

  } catch (error) {
    console.error(error);
    res.json({ result: "⚠ AI failed" });
  }
});

// =========================
// 🤖 AI CHAT API
// =========================
app.post("/ai-chat", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.json({ reply: "Please enter a message" });
    }

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
    });

    res.json({
      reply: completion.choices[0].message.content
    });

  } catch (err) {
    console.log(err);
    res.json({ reply: "AI failed" });
  }
});

// =========================
// 🤖 TEXT SUMMARIZER API
// =========================
app.post("/summarize", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.json({ summary: "No text provided" });
    }

    const prompt = `Summarize the following text:\n${text}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
    });

    res.json({
      summary: completion.choices[0].message.content
    });

  } catch (err) {
    console.log(err);
    res.json({ summary: "AI failed" });
  }
});

// =========================
// 📧 EMAIL WRITER AI
// =========================
app.post("/email", async (req, res) => {
  try {
    const { text, tone } = req.body;

    if (!text) {
      return res.json({ email: "Please enter content" });
    }

    const prompt = `Write a ${tone} email:\n${text}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
    });

    res.json({
      email: completion.choices[0].message.content
    });

  } catch (err) {
    console.log(err);
    res.json({ email: "AI failed" });
  }
});

// =========================
// 📝 BLOG GENERATOR AI
// =========================
app.post("/blog", async (req, res) => {
  try {
    const { topic, tone, length } = req.body;

    if (!topic) {
      return res.json({ blog: "Please enter topic" });
    }

    const prompt = `Write a ${length} ${tone} blog on:\n${topic}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
    });

    res.json({
      blog: completion.choices[0].message.content
    });

  } catch (err) {
    console.log(err);
    res.json({ blog: "AI failed" });
  }
});

// =========================
// 🔐 SIGNUP API
// =========================
app.post("/signup", async (req, res) => {
  try {
    const { username, password } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) return res.json({ success: false });

    const hashedPassword = await bcrypt.hash(password, 10);

    await new User({ username, password: hashedPassword }).save();

    res.json({ success: true });

  } catch {
    res.json({ success: false });
  }
});

// =========================
// 🔐 LOGIN API (JWT)
// =========================
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.json({ success: false });
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res.json({ success: false });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.json({ success: false });
    }

    const token = jwt.sign(
      { username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ success: true, token });

  } catch (error) {
    console.error(error);
    res.json({ success: false });
  }
});

// =========================
// 📩 CONTACT API
// =========================
app.post("/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body;
    await new Contact({ name, email, message }).save();
    await transporter.sendMail({
      from: "quicktoolsstudent@gmail.com",
      to: "quicktoolsstudent@gmail.com",
      subject: "New Contact Message",
      text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
    });
     
    console.log("✅ EMAIL SENT SUCCESS");

    res.json({ success: true });

  } catch (err) {
    console.log("❌ EMAIL ERROR:", err);
    res.json({ success: false });
  }
});

// =========================
// 📊 STATS API
// =========================
app.get("/stats", async (req, res) => {
  try {
    const totalMessages = await Contact.countDocuments();
    const totalUsers = await User.countDocuments();

    res.json({
      messages: totalMessages,
      users: totalUsers
    });

  } catch (err) {
    console.log(err);
    res.json({ messages: 0, users: 0 });
  }
});

// =========================
// 🗑 DELETE MESSAGE
// =========================
app.delete("/contact/:id", async (req, res) => {
  try {
    await Contact.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.json({ success: false });
  }
});

// =========================
// 📊 GET ALL CONTACT MESSAGES
// =========================
app.get("/contacts", async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    console.log(err);
    res.json([]);
  }


 
});
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

