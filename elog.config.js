module.exports = {
  write: {
    platform: 'feishu',
    feishu: {
      type: 'wiki',                              // 知识库模式
      wikiId: process.env.FEISHU_WIKI_ID,        // 飞书知识库 ID
      appId: process.env.FEISHU_APP_ID,          // 飞书应用 App ID
      appSecret: process.env.FEISHU_APP_SECRET,  // 飞书应用 App Secret
      limit: 10,                                  // 下载并发数
    },
  },
  deploy: {
    platform: 'local',
    local: {
      outputDir: './docs/posts',                  // 输出到 VitePress 内容目录
      filename: 'title',
      format: 'markdown',
      catalog: true,                              // 保留飞书目录结构
      formatExt: './elog.format.js',
    },
  },
  image: {
    enable: true,
    platform: 'local',
    local: {
      outputDir: './docs/public/images',          // 图片存到 public 目录
      pathFollowDoc: true,
    },
  },
}
