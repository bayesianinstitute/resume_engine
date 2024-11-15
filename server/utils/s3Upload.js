// s3Upload.js
import AWS from "aws-sdk";
import { Parser } from "json2csv";
import fs from "fs";
import path from "path";

import { fileURLToPath } from "url";

// // Configure AWS SDK
// AWS.config.update({
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   region: process.env.AWS_REGION,
// });

// const s3 = new AWS.S3();

/**
 * Convert JSON data to CSV
 * @param {Array<Object>} data - Array of JSON objects to convert to CSV
 * @returns {string} - CSV formatted string
 */
const convertToCSV = (data) => {
  const json2csvParser = new Parser();
  return json2csvParser.parse(data);
};

/**
 * Upload CSV file to S3
 * @param {string} csvData - CSV data as a string
 * @param {string} fileName - The name for the CSV file in S3
 * @returns {Promise<string>} - URL of the uploaded file in S3
 */
const uploadCSVToS3 = async (csvData, fileName) => {
  // Get the current directory path in an ES module environment
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const csvFilePath = path.join(__dirname, `${fileName}.csv`);
  fs.writeFileSync(csvFilePath, csvData);

  // Send the file location
  const fileLocation = `${__dirname}/${"match_results_1731620557999"}.csv`;

  return fileLocation;
  // // Save CSV to a temporary file
  // const csvFilePath = path.join('/tmp', `${fileName}.csv`);
  // fs.writeFileSync(csvFilePath, csvData);

  //   const s3Params = {
  //     Bucket: process.env.S3_BUCKET_NAME,
  //     Key: `match_results/${fileName}.csv`,
  //     Body: fs.createReadStream(csvFilePath),
  //     ContentType: 'text/csv',
  //   };

  //   const uploadResult = await s3.upload(s3Params).promise();

  // Clean up the temporary file after upload
  //   fs.unlinkSync(csvFilePath);

  // return uploadResult.Location;
};

export { convertToCSV, uploadCSVToS3 };
