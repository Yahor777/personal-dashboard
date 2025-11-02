import http from "http";

const url = "http://localhost:4000/api/search?q=rx%20580&marketplace=olx";

http
  .get(url, (res) => {
    let data = "";
    res.on("data", (chunk) => {
      data += chunk;
    });
    res.on("end", () => {
      console.log(data);
    });
  })
  .on("error", (error) => {
    console.error("Request failed:", error.message);
    process.exit(1);
  });
