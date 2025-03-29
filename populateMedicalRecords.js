require("dotenv").config();
const AWS = require("aws-sdk");

/**
 * Configure AWS
 *  - If running on an EC2 with IAM roles, you may not need to set AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY
 *  - Otherwise, ensure they are set in your .env or environment variables
 */
AWS.config.update({
  region: process.env.AWS_REGION || "us-east-2",
  // Uncomment if you want to explicitly use credentials from environment variables:
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "MedicalRecords";

/**
 * Sample Users
 * - 'sub' is the Cognito user’s unique ID
 * - We'll store the user's profile and two sample records for each
 */
const users = [
  {
    fullName: "Jane Doe",
    username: "janedoe",
    sub: "117b8510-b001-70bc-fd50-58c44418cb5f",
    age: 28,
    bloodType: "A+",
    weight: "65kg",
    records: [
      {
        recordID: "REC#2025-01-15",
        diagnosis: "General Checkup",
        date: "2025-01-15",
      },
      {
        recordID: "REC#2025-02-10",
        diagnosis: "Blood Test",
        date: "2025-02-10",
      },
    ],
  },
  {
    fullName: "Alice Johnson",
    username: "alicejohnson",
    sub: "51db65b0-70d1-7023-3b8b-11aa489bc231",
    age: 32,
    bloodType: "B+",
    weight: "60kg",
    records: [
      {
        recordID: "REC#2025-02-01",
        diagnosis: "Routine Checkup",
        date: "2025-02-01",
      },
      {
        recordID: "REC#2025-03-05",
        diagnosis: "X-Ray",
        date: "2025-03-05",
      },
    ],
  },
  {
    fullName: "John Smith",
    username: "johnsmith",
    sub: "617ba5b0-9091-7073-b7a8-fca1a6a80ee1",
    age: 30,
    bloodType: "O+",
    weight: "75kg",
    records: [
      {
        recordID: "REC#2025-01-15",
        diagnosis: "General Checkup",
        date: "2025-01-15",
      },
      {
        recordID: "REC#2025-02-10",
        diagnosis: "Blood Test",
        date: "2025-02-10",
      },
    ],
  },
  {
    fullName: "Bob Williams",
    username: "bobwilliams",
    sub: "817b0590-3061-7070-9ad6-55e5200bb969",
    age: 45,
    bloodType: "AB-",
    weight: "85kg",
    records: [
      {
        recordID: "REC#2025-02-20",
        diagnosis: "Flu Shot",
        date: "2025-02-20",
      },
      {
        recordID: "REC#2025-03-10",
        diagnosis: "Allergy Test",
        date: "2025-03-10",
      },
    ],
  },
  {
    fullName: "Mark Brown",
    username: "markbrown",
    sub: "818b1540-9071-70b8-d2eb-b0c5e7804934",
    age: 29,
    bloodType: "O+",
    weight: "72kg",
    records: [
      {
        recordID: "REC#2025-01-05",
        diagnosis: "Blood Pressure Check",
        date: "2025-01-05",
      },
      {
        recordID: "REC#2025-02-15",
        diagnosis: "Lab Work",
        date: "2025-02-15",
      },
    ],
  },
];

/**
 * Create a "PROFILE" item for each user
 */
async function createUserProfile(user) {
  const params = {
    TableName: TABLE_NAME,
    Item: {
      PatientID: user.sub,  // Partition Key
      RecordID: "PROFILE",  // Sort Key to indicate this is the profile item
      FullName: user.fullName,
      Username: user.username,
      Age: user.age,
      BloodType: user.bloodType,
      Weight: user.weight,
    },
  };

  await dynamoDB.put(params).promise();
  console.log(`Created PROFILE for user: ${user.fullName} (${user.sub})`);
}

/**
 * Create medical record items for each user
 */
async function createMedicalRecord(user, record) {
  const params = {
    TableName: TABLE_NAME,
    Item: {
      PatientID: user.sub,       // Partition Key
      RecordID: record.recordID, // Sort Key
      Diagnosis: record.diagnosis,
      Date: record.date,
    },
  };

  await dynamoDB.put(params).promise();
  console.log(
    `Created record [${record.recordID}] for user: ${user.fullName} (${user.sub})`
  );
}

async function main() {
  for (const user of users) {
    // Create a PROFILE item
    await createUserProfile(user);

    // Create each medical record item
    for (const record of user.records) {
      await createMedicalRecord(user, record);
    }
  }

  console.log("All sample users and records have been inserted successfully!");
}

main().catch((err) => {
  console.error("Error populating MedicalRecords:", err);
});
