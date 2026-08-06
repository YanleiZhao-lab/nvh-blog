/**
 * Elog 自定义文档处理
 * 将飞书导出的 Markdown 做适配处理，兼容 VitePress
 */
const format = async (doc) => {
  if (doc.body) {
    // 飞书高亮块转 VitePress 格式
    doc.body = doc.body?.replaceAll(':::tips', ':::tip')
    doc.body = doc.body?.replaceAll(':::success', ':::tip')
    doc.body = doc.body?.replaceAll(':::warning', ':::warning')
    doc.body = doc.body?.replaceAll(':::danger', ':::danger')
  }
  return doc;
};

module.exports = {
  format,
};
