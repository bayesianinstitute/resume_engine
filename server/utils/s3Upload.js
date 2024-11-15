// s3Upload.js
import AWS from "aws-sdk";
import { Parser } from "json2csv";
import fs from "fs";
import path from "path";

import { fileURLToPath } from "url";

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});


const s3 = new AWS.S3();




const convertToCSV = (data) => {
  const json2csvParser = new Parser();
  return json2csvParser.parse(data);
};



const uploadCSVToS3 = async (csvData, fileName) => {
  // Get the current directory path in an ES module environment
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Save CSV to a temporary file
  const csvFilePath = path.join("/tmp", `${fileName}.csv`);

  const s3Params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `match_results/${fileName}.csv`,
    Body: fs.createReadStream(csvFilePath),
    ContentType: "text/csv",
  };

  const uploadResult = await s3.upload(s3Params).promise();

  // Clean up the temporary file after upload
  fs.unlinkSync(csvFilePath);

  console.log(uploadResult.Location);

  return uploadResult.Location;
};

// New function to upload a PDF to S3
const uploadPDFToS3 = async (pdfBuffer, fileName) => {
  const s3Params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `resumes/${fileName}.pdf`,
    Body: pdfBuffer,
    ContentType: "application/pdf",
  };

  const uploadResult = await s3.upload(s3Params).promise();

  console.log(uploadResult.Location);

  return uploadResult.Location;
};

const deleteFromS3 = async (s3Url) => {
  // Extract the S3 object key from the S3 URL
  const s3Key = s3Url.split('.com/')[1]; // Assumes URL format: https://<bucket-name>.s3.<region>.amazonaws.com/<key>

  if (!s3Key) {
    throw new Error("Invalid S3 URL. Cannot extract key.");
  }

  const s3Params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: s3Key,
  };

  try {
    await s3.deleteObject(s3Params).promise();
    console.log(`Successfully deleted ${s3Key} from S3.`);
  } catch (error) {
    console.error(`Error deleting ${s3Key} from S3:`, error);
    throw new Error("Failed to delete file from S3.");
  }
};
export { convertToCSV, uploadCSVToS3,uploadPDFToS3,deleteFromS3 };
