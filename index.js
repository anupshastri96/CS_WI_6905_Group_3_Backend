require("dotenv").config();
const express = require("express");
const AWS = require("aws-sdk");
const multer = require("multer");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 5000;

// Enable CORS (allows frontend to communicate with backend)
app.use(cors());
app.use(express.json());

// AWS Configuration
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || "us-east-1",
});

// DynamoDB
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "MedicalRecords";

// S3
const s3 = new AWS.S3();
const upload = multer({ storage: multer.memoryStorage() });

// API: Health Check
app.get("/", (req, res) => {
  res.json({ message: "Node.js Backend is Running! 🚀" });
});

// API: Get User Data
app.get("/user", (req, res) => {
  const userData = {
    name: "John Doe",
    id: "12345",
    age: 34,
    bloodType: "O+",
    weight: "75kg",
  };
  res.json(userData);
});

// API: Get Recent Records
app.get("/records", (req, res) => {
  const records = [
    { name: "General Checkup", date: "Jan 15, 2025" },
    { name: "Chest X-Ray", date: "Jan 10, 2025" },
  ];
  res.json(records);
});

// API: Get Active Prescriptions
app.get("/prescriptions", (req, res) => {
  const prescriptions = [
    { name: "Amoxicillin", dosage: "3 times daily - 7 days" },
    { name: "Ibuprofen", dosage: "As needed for pain" },
  ];
  res.json(prescriptions);
});

// API: Get Upcoming Appointments
app.get("/appointments", (req, res) => {
  const appointments = [
    { doctor: "Dr. Sarah Smith", date: "Feb 1, 2025" },
  ];
  res.json(appointments);
});

// API: Upload X-ray to S3
app.post("/upload-xray", upload.single("xray"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `${Date.now()}-${req.file.originalname}`,
    Body: req.file.buffer,
    ContentType: req.file.mimetype,
  };

  try {
    const uploadResult = await s3.upload(params).promise();
    res.json({ message: "X-Ray uploaded successfully!", url: uploadResult.Location });
  } catch (error) {
    console.error("S3 Upload Error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
});

// API: Store Medical Record in DynamoDB
app.post("/save-medical-record", async (req, res) => {
  const { PatientID, Diagnosis, Date } = req.body;

  if (!PatientID || !Diagnosis || !Date) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const params = {
    TableName: TABLE_NAME,
    Item: { PatientID, Diagnosis, Date },
  };

  try {
    await dynamoDB.put(params).promise();
    res.json({ message: "Medical record saved successfully!" });
  } catch (error) {
    console.error("DynamoDB Error:", error);
    res.status(500).json({ error: "Error saving record" });
  }
});

// Start Server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
