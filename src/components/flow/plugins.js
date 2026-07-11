// 无限画布可用的“插件”节点定义。先提供几种常用类型。
export const PLUGINS = {
  upload: {
    title: '素材上传',
    icon: '📤',
    accent: '#57c7ff',
    hint: '人物 / 商品 / 场景图',
    body: 'upload',
    hasIn: false,
    hasOut: true
  },
  reference: {
    title: '参考图',
    icon: '🎯',
    accent: '#4fd1a5',
    hint: '风格 / 姿势 / 构图参考',
    body: 'upload',
    hasIn: false,
    hasOut: true
  },
  prompt: {
    title: '文本提示',
    icon: '📝',
    accent: '#ffd23f',
    hint: '描述画面 / 风格关键词',
    body: 'textarea',
    hasIn: true,
    hasOut: true
  },
  image: {
    title: '图像生成',
    icon: '🖼️',
    accent: '#ff9ec4',
    hint: '文生图 / 图生图',
    body: 'image',
    hasIn: true,
    hasOut: true
  },
  video: {
    title: '视频生成',
    icon: '🎬',
    accent: '#b083f0',
    hint: '图生视频 / 前后对比',
    body: 'video',
    hasIn: true,
    hasOut: true
  }
}

export const PLUGIN_LIST = Object.entries(PLUGINS).map(([type, meta]) => ({ type, ...meta }))
