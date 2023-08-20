const fs = require("fs");
const { Client } = require("@notionhq/client");
const nodemailer = require("nodemailer");
const marked = require("marked"); // Library to convert Markdown to HTML
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
require('dotenv').config(); // Load environment variables from .env

// Replace with your Notion API credentials
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const DATABASE_ID = process.env.DATABASE_ID;

// Define the CSV file path
const CSV_FILE_PATH = "email_results.csv";

async function getEmailTemplate() {
  return new Promise((resolve, reject) => {
    fs.readFile("email_template.md", "utf8", (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

async function queryNotionDatabase() {
  const notion = new Client({ auth: NOTION_API_KEY });

  try {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
    });

    // Filter rows where Last Updated is today
    const today = new Date().toISOString().slice(0, 10);
    const rowsToUpdate = response.results.filter(
      (row) => row.properties["Last Update"]?.date?.start === today
    );

    console.log("Rows to update:", rowsToUpdate);

    if (rowsToUpdate.length === 0) {
      console.log("No rows updated today.");
      return;
    }

    const transporter = nodemailer.createTransport({
      host: "email-smtp.us-east-1.amazonaws.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const emailTemplate = await getEmailTemplate();

    // Define the CSV headers including the "Date" header
    const csvHeaders = [
      { id: "date", title: "Date" },
      { id: "name", title: "Name" },
      { id: "email", title: "Email" },
      { id: "body", title: "Body" },
    ];

    // Create the CSV writer
    const csvWriter = createCsvWriter({
      path: CSV_FILE_PATH,
      header: csvHeaders,
    });

    for (const row of rowsToUpdate) {
      const name = row.properties["Name"]?.title[0].plain_text;

      const emailBody = emailTemplate.replace("{{creator_name}}", name);

      const mailOptions = {
        from: "kamal@kroto.in",
        to: row.properties["email"]?.email,
        subject: "Generate awesome courses with AI, with no effort from you side.",
        html: marked.parse(emailBody, {
          headerIds: false,
          mangle: false,
        }),
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending email:", error);
        } else {
          console.log("Email sent:", info.response);

          // Append data to the CSV file including the current date
          const csvData = [
            {
              date: new Date().toLocaleString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "numeric",
                minute: "numeric",
              }),
              name,
              email: row.properties["email"]?.email,
              body: emailBody,
              response: info.response,
            },
          ];

          csvWriter.writeRecords(csvData).then(() => {
            console.log("Data added to CSV file.");
          });
        }
      });
      console.log(
        "Email sent to:",
        row.properties["email"]?.email,
        "successfully"
      );
    }
  } catch (error) {
    console.error("Error querying Notion database:", error);
  }
}

queryNotionDatabase();
