import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'CS Knowledge Wiki',
  description: '我的计算机知识库 - 从基础到面试全攻略',

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: '首页', link: '/' },
      { text: '学习指南', link: '/guide/' },
      { text: '面试八股', link: '/interview/' },
      { text: '项目笔记', link: '/projects/' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '学习指南',
          items: [
            { text: '概览', link: '/guide/' },
            { text: '计算机网络', link: '/guide/network' },
            { text: '操作系统', link: '/guide/os' },
            { text: '数据库', link: '/guide/database' },
          ],
        },
      ],
      '/interview/': [
        {
          text: '面试八股',
          items: [
            { text: '概览', link: '/interview/' },
            { text: 'Java', link: '/interview/java' },
            { text: 'Go', link: '/interview/go' },
            { text: '系统设计', link: '/interview/system-design' },
          ],
        },
      ],
      '/projects/': [
        {
          text: '项目笔记',
          items: [
            { text: '概览', link: '/projects/' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/wu000376/cs-knowledge-wiki' },
    ],

    search: {
      provider: 'local',
    },

    footer: {
      message: '用心记录，持续成长',
      copyright: 'Copyright © 2026',
    },
  },
})
