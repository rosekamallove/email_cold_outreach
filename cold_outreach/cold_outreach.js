const fs = require("fs");
const nodemailer = require("nodemailer");
const marked = require("marked"); // Library to convert Markdown to HTML

// Replace with your email credentials
const EMAIL_USER = "AKIAVYSH5ETA5ZQXTFEA";
const EMAIL_PASSWORD = "BENvzczHQJ83J19kWBC8x4TqCGjN7vje3fWwKjqmAw9R";

// Define the CSV file paths
const INPUT_CSV_FILE = "emails.csv";

async function getEmailTemplate() {
  return new Promise((resolve, reject) => {
    fs.readFile("template.md", "utf8", (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

const transporter = nodemailer.createTransport({
  host: "email-smtp.us-east-1.amazonaws.com",
  port: 465,
  secure: true,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD,
  },
});

async function sendEmailsFromCSV(csvData) {
  const emailTemplate = await getEmailTemplate();

  let count = 1;

  for (const row of csvData) {
    const { name, email, domain } = row;

    const emailBody = emailTemplate.replace("{{creator_name}}", name);

    const mailOptions = {
      from: "kamal@kroto.in",
      to: email,
      subject: `RE: Generate awesome courses with AI in ${domain}`,
      html: marked.parse(emailBody, {
        headerIds: false,
        mangle: false,
      }),
    };

    count++;

    transporter.sendMail(mailOptions, (error, _) => {
      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log(email, "successful");
      }
    });
  }
}

// Read data from input CSV file and call the function to send emails
fs.readFile(INPUT_CSV_FILE, "utf8", (err, data) => {
  if (err) {
    console.error("Error reading input CSV file:", err);
  } else {
    const lines = data.trim().split("\n");
    const csvData = lines.map((line) => {
      const [subscribers, name, youtubeLink, domain, email] = line.split(",");
      return { subscribers, name, youtubeLink, domain, email };
    });
    sendEmailsFromCSV(csvData);
  }
});
