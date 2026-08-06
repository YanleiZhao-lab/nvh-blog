import { getCollection } from "astro:content";

export async function GET() {
  const posts = (await getCollection("blog")).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  const items = posts.map((post) => `
    <item>
      <title><![CDATA[${post.data.title}]]></title>
      <description><![CDATA[${post.data.description}]]></description>
      <link>https://www.nvhtest.cn/blog/${post.slug}/</link>
      <guid>https://www.nvhtest.cn/blog/${post.slug}/</guid>
      <pubDate>${post.data.date.toUTCString()}</pubDate>
    </item>`).join("");

  return new Response(`<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>NVH Test Blog</title>
    <link>https://www.nvhtest.cn/</link>
    <description>NVH 工程研究博客</description>
    ${items}
  </channel>
</rss>`, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" }
  });
}
