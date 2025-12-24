export default {
  async fetch() {

    const FEEDS = [
      { url: "https://www.livemint.com/rss/markets", source: "MINT" },
      { url: "https://www.livemint.com/rss/companies", source: "MINT" },
      { url: "https://www.livemint.com/rss/economy", source: "MINT" },

      { url: "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms", source: "ET" },
      { url: "https://economictimes.indiatimes.com/news/economy/rssfeeds/1373380680.cms", source: "ET" },

      { url: "https://www.moneycontrol.com/rss/latestnews.xml", source: "MC" }
    ];

    const articles = new Map();

    const clean = (str = "") =>
      str
        .replace(/<!\[CDATA\[|\]\]>/g, "")
        .replace(/&amp;/g, "&")
        .trim();

        const getDate = (item, link) => {
          // 1️⃣ Try RSS date tags
          const tryTags = ["pubDate", "updated", "dc:date"];
          for (const tag of tryTags) {
            const match = item.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
            if (match) {
              const t = new Date(match[1]).getTime();
              if (!isNaN(t)) return t;
            }
          }
        
          // 2️⃣ Try extracting epoch from URL (Livemint style)
          const epochMatch = link?.match(/-(\d{13,})\.html/);
          if (epochMatch) {
            const t = Number(epochMatch[1]);
            if (!isNaN(t)) return t;
          }
        
          // 3️⃣ Final fallback
          return Date.now();
        };
        

    await Promise.all(
      FEEDS.map(async feed => {
        try {
          const res = await fetch(feed.url, { cf: { cacheTtl: 300 } });
          const xml = await res.text();

          const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];

          for (const raw of items) {
            const item = raw[1];

            const extract = tag =>
              item.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`))?.[1];

            const title = clean(extract("title"));
            const link = clean(extract("link"));

            if (!title || !link) continue;

            const id = btoa(link); // unique & stable

            if (articles.has(id)) continue;

            articles.set(id, {
              id,
              headline: title,
              link,
              source: feed.source,
              timestamp: getDate(item, link)

            });
          }
        } catch (_) {}
      })
    );

    return new Response(
      JSON.stringify(
        [...articles.values()]
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 50)
      ),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );
  }
};
