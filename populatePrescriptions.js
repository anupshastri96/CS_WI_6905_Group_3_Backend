require("dotenv").config();
const AWS = require("aws-sdk");

// Configure AWS (adjust region/credentials as needed)
AWS.config.update({
  region: process.env.AWS_REGION || "us-east-2",
  // If running locally, ensure your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are set
  // accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  // secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "MedicalRecords";

// Sample users with prescription data
const users = [
  {
    fullName: "Jane Doe",
    sub: "117b8510-b001-70bc-fd50-58c44418cb5f",
    prescriptions: [
      { recordID: "PRE#2025-03-10", name: "Paracetamol", dosage: "Twice daily" },
      { recordID: "PRE#2025-04-05", name: "Ibuprofen", dosage: "As needed" },
    ],
  },
  {
    fullName: "Alice Johnson",
    sub: "51db65b0-70d1-7023-3b8b-11aa489bc231",
    prescriptions: [
      { recordID: "PRE#2025-03-15", name: "Amoxicillin", dosage: "3 times daily - 7 days" },
      { recordID: "PRE#2025-04-10", name: "Loratadine", dosage: "Once daily" },
    ],
  },
  {
    fullName: "John Smith",
    sub: "617ba5b0-9091-7073-b7a8-fca1a6a80ee1",
    prescriptions: [
      { recordID: "PRE#2025-02-20", name: "Ibuprofen", dosage: "As needed" },
      { recordID: "PRE#2025-03-05", name: "Paracetamol", dosage: "Twice daily" },
    ],
  },
  {
    fullName: "Bob Williams",
    sub: "817b0590-3061-7070-9ad6-55e5200bb969",
    prescriptions: [
      { recordID: "PRE#2025-03-25", name: "Cetirizine", dosage: "Once daily" },
      { recordID: "PRE#2025-04-15", name: "Diclofenac", dosage: "Thrice daily" },
    ],
  },
  {
    fullName: "Mark Brown",
    sub: "818b1540-9071-70b8-d2eb-b0c5e7804934",
    prescriptions: [
      { recordID: "PRE#2025-02-28", name: "Paracetamol", dosage: "Twice daily" },
      { recordID: "PRE#2025-03-20", name: "Ibuprofen", dosage: "As needed" },
    ],
  },
];

async function createPrescription(user, prescription) {
  const params = {
    TableName: TABLE_NAME,
    Item: {
      PatientID: user.sub,           // Partition Key using the Cognito sub
      RecordID: prescription.recordID, // Sort Key starting with "PRE#"
      Name: prescription.name,
      Dosage: prescription.dosage,
    },
  };

  await dynamoDB.put(params).promise();
  console.log(`Created prescription ${prescription.recordID} for ${user.fullName}`);
}

async function main() {
  for (const user of users) {
    for (const prescription of user.prescriptions) {
      await createPrescription(user, prescription);
    }
  }
  console.log("All prescription records have been inserted successfully!");
}

main().catch((err) => {
  console.error("Error inserting prescriptions:", err);
});
