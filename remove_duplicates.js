const fs = require("fs");
const csv = require("csv-parser");

const inputFilePath = "youtube_channel_list.csv";
const outputFilePath = "youtube_channel_list_removed_duplicated.csv";

const uniqueNames = new Set();
const uniqueRows = [];

fs.createReadStream(inputFilePath)
  .pipe(csv())
  .on("data", (row) => {
    const name = row["Name"];
    if (!uniqueNames.has(name)) {
      uniqueNames.add(name);
      uniqueRows.push(row);
    }
  })
  .on("end", () => {
    const csvContent = uniqueRows
      .map((row) => Object.values(row).join(","))
      .join("\n");

    fs.writeFileSync(outputFilePath, csvContent);

    console.log(
      'Duplicated rows based on "Name" field removed and saved to output.csv'
    );
  });
