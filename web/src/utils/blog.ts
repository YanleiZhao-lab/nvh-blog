// 阅读时间计算 — 中文约 300 字/分钟，英文约 200 词/分钟
export function getReadingTime(content: string): number {
  // 去掉 markdown frontmatter
  const text = content.replace(/^---[\s\S]*?---/, "").trim();
  // 中文字符
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  // 英文单词
  const englishWords = (text.replace(/[\u4e00-\u9fa5]/g, " ").match(/[a-zA-Z]+/g) || []).length;
  const minutes = Math.ceil(chineseChars / 300 + englishWords / 200);
  return Math.max(1, minutes);
}

// 格式化日期
export function formatDate(date: Date): string {
  return date.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
}

// 状态映射到 badge 类型
export function statusBadge(status: string): string {
  const map: Record<string, string> = {
    "可发布": "badge--success",
    "准备中": "badge--warning",
    "规划中": "badge--default",
    "后续接入": "badge--default",
  };
  return map[status] || "badge--default";
}
