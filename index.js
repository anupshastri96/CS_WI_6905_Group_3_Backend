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

// AWS Configuration (Use IAM Role if running on EC2)
const awsConfig = {
  region: process.env.AWS_REGION || "us-east-1",
};

// Use environment credentials only if not running on EC2 with IAM roles
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  awsConfig.accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  awsConfig.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
}

AWS.config.update(awsConfig);

// DynamoDB
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "MedicalRecords";

// S3 Storage
const s3 = new AWS.S3();
const upload = multer({ storage: multer.memoryStorage() });

// ✅ Health Check API
app.get("/", (req, res) => {
  res.json({ message: "Node.js Backend is Running! 🚀" });
});

// ✅ Fetch User Data
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

// ✅ Fetch Recent Records
app.get("/records", (req, res) => {
  const records = [
    { name: "General Checkup", date: "Jan 15, 2025" },
    { name: "Chest X-Ray", date: "Jan 10, 2025" },
  ];
  res.json(records);
});

// ✅ Fetch Active Prescriptions
app.get("/prescriptions", (req, res) => {
  const prescriptions = [
    { name: "Amoxicillin", dosage: "3 times daily - 7 days" },
    { name: "Ibuprofen", dosage: "As needed for pain" },
  ];
  res.json(prescriptions);
});

// ✅ Fetch Upcoming Appointments
app.get("/appointments", (req, res) => {
  const appointments = [
    { doctor: "Dr. Sarah Smith", date: "Feb 1, 2025" },
  ];
  res.json(appointments);
});

// ✅ Upload X-ray to S3
app.post("/upload-xray", upload.single("xray"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const timestamp = Date.now();
  const filename = `${timestamp}-${req.file.originalname}`;

  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: filename,
    Body: req.file.buffer,
    ContentType: req.file.mimetype,
  };

  try {
    const uploadResult = await s3.upload(params).promise();
    
    res.json({
      message: "X-Ray uploaded successfully!",
      url: uploadResult.Location,
      fileName: filename,
      timestamp: timestamp,
    });
  } catch (error) {
    console.error("S3 Upload Error:", error);
    res.status(500).json({ error: "Upload failed", details: error.message });
  }
});

// ✅ Store Medical Record in DynamoDB
app.post("/save-medical-record", async (req, res) => {
  const { PatientID, Diagnosis, Date } = req.body;

  if (!PatientID || !Diagnosis || !Date) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const checkIfExists = {
    TableName: TABLE_NAME,
    Key: { PatientID },
  };

  try {
    const existingRecord = await dynamoDB.get(checkIfExists).promise();

    if (existingRecord.Item) {
      return res.status(409).json({ error: "Record already exists for this patient." });
    }

    const params = {
      TableName: TABLE_NAME,
      Item: { PatientID, Diagnosis, Date },
    };

    await dynamoDB.put(params).promise();
    res.json({ message: "Medical record saved successfully!", data: params.Item });
  } catch (error) {
    console.error("DynamoDB Error:", error);
    res.status(500).json({ error: "Error saving record", details: error.message });
  }
});

// ✅ Fetch Medical Record by PatientID
app.get("/medical-record/:patientID", async (req, res) => {
  const { patientID } = req.params;

  const params = {
    TableName: TABLE_NAME,
    Key: { PatientID: patientID },
  };

  try {
    const data = await dynamoDB.get(params).promise();
    if (!data.Item) {
      return res.status(404).json({ error: "No medical record found for this PatientID" });
    }
    res.json(data.Item);
  } catch (error) {
    console.error("DynamoDB Fetch Error:", error);
    res.status(500).json({ error: "Error fetching record", details: error.message });
  }
});

// ✅ Delete Medical Record
app.delete("/delete-medical-record/:patientID", async (req, res) => {
  const { patientID } = req.params;

  const params = {
    TableName: TABLE_NAME,
    Key: { PatientID: patientID },
  };

  try {
    await dynamoDB.delete(params).promise();
    res.json({ message: "Medical record deleted successfully" });
  } catch (error) {
    console.error("DynamoDB Delete Error:", error);
    res.status(500).json({ error: "Error deleting record", details: error.message });
  }
});

// Start Server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
