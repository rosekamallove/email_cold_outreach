const fs = require("fs");
const { google } = require("googleapis");
const json2csv = require("json2csv").parse;

// Your YouTube API credentials (replace with your actual values)
const apiKey = "AIzaSyBR3F9lodP7zQ3wiY3FY0dHS_8edP5j6NM";

// Initialize the YouTube API client
const youtube = google.youtube({
  version: "v3",
  auth: apiKey,
});

const domain = "Mobile App Development"; // Your specific domain here
const minSubscribers = 5000;
const NUMBER_OF_RESULTS = 1000000;
const FETCH_RESULTS = 100;

let count;

async function searchChannels() {
  let channelCount = 0;

  try {
    let nextPageToken = null;
    let channelDetails = [];

    do {
      const response = await youtube.search.list({
        part: "snippet",
        q: domain,
        type: "channel",
        maxResults: FETCH_RESULTS,
        pageToken: nextPageToken,
      });

      count += FETCH_RESULTS;

      const relevantChannels = response.data.items;

      for (const channel of relevantChannels) {
        channelCount++;

        const channelId = channel.id.channelId;
        const channelResponse = await youtube.channels.list({
          part: "snippet,statistics",
          id: channelId,
        });

        const details = channelResponse.data.items[0];
        if (details.statistics.subscriberCount > minSubscribers) {
          console.log(
            channelCount,
            details.snippet.title,
            details.statistics.subscriberCount,
          );
          channelDetails.push({
            Subscribers: details.statistics.subscriberCount,
            Name: details.snippet.title,
            Link: `https://www.youtube.com/channel/${channelId}/about`,
            Domain: domain,
            Email: "add email here", // Replace with your method of obtaining email
          });
        }
      }
      const csvData = json2csv(channelDetails);
      channelDetails = [];
      fs.appendFileSync("youtube_channel_list.csv", csvData, "utf-8");

      if (count === NUMBER_OF_RESULTS) break;

      nextPageToken = response.data.nextPageToken;
    } while (nextPageToken);

    console.log("Data appended to youtube_channel_list.csv");
  } catch (error) {
    console.error("Error:", error);
  }
}

searchChannels();
