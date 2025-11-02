import axios from "axios";
import * as cheerio from "cheerio";

const url = "https://www.olx.pl/d/elektronika/komputery/podzespoly-i-czesci/q-Rx%20580%20Pozna%C5%84?search%5Bfilter_enum_delivery_methods%5D%5B0%5D=olx_delivery&search%5Bdescription%5D=1";

try {
  const response = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7",
    },
  });
  const $ = cheerio.load(response.data);
  const links = [];
  $("a").each((_, el) => {
    const href = $(el).attr("href");
    if (href && /oferta/.test(href)) {
      links.push(href);
    }
  });
  console.log("Total oferta links:", links.length);
  console.log(links.slice(0, 10));
} catch (error) {
  console.error("Failed to load sample:", error.message);
}
