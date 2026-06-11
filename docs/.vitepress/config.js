import { defineConfig } from 'vitepress'

// Shared social links / theme bits
const GITHUB_URL = 'https://github.com/hswsp/cs-knowledge-wiki'

export default defineConfig({
  title: 'CS Knowledge Wiki',
  description: 'A personal computer science knowledge base — math, algorithms, Java, C++, databases.',
  cleanUrls: true,
  lastUpdated: true,

  head: [
    ['link', { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }],
  ],

  themeConfig: {
    logo: '/logo.svg',
    search: { provider: 'local' },
    socialLinks: [{ icon: 'github', link: GITHUB_URL }],
  },

  locales: {
    root: {
      label: '简体中文',
      lang: 'zh-CN',
      title: 'CS 知识库',
      description: '个人计算机知识库：数学 / 算法 / Java / C++ / 数据库',
      themeConfig: {
        nav: [
          { text: '首页', link: '/' },
          { text: '数学', link: '/math/' },
          { text: '算法', link: '/algorithm/' },
          { text: '机器学习', link: '/ml/' },
          { text: 'Java', link: '/java/' },
          { text: 'C++', link: '/cpp/' },
          { text: '数据库', link: '/database/' },
          { text: '系统设计', link: '/system-design/' },
          { text: '关于', link: '/about/' },
        ],
        sidebar: {
          '/math/': [
            { text: '数学', items: [{ text: '概览', link: '/math/' }] },
          ],
          '/algorithm/': [
            { text: '算法', items: [{ text: '概览', link: '/algorithm/' }] },
          ],
          '/ml/': [
            { text: '机器学习', items: [{ text: '概览', link: '/ml/' }] },
          ],
          '/java/': [
            { text: 'Java', items: [{ text: '概览', link: '/java/' }] },
          ],
          '/cpp/': [
            { text: 'C++', items: [{ text: '概览', link: '/cpp/' }] },
          ],
          '/database/': [
            { text: '数据库', items: [{ text: '概览', link: '/database/' }] },
          ],
          '/system-design/': [
            { text: '系统设计', items: [{ text: '概览', link: '/system-design/' }] },
          ],
        },
        outline: { label: '本页目录', level: [2, 3] },
        docFooter: { prev: '上一篇', next: '下一篇' },
        lastUpdatedText: '最后更新',
        darkModeSwitchLabel: '主题',
        sidebarMenuLabel: '菜单',
        returnToTopLabel: '返回顶部',
        footer: {
          message: '用心记录，持续成长',
          copyright: `Copyright © ${new Date().getFullYear()} hswsp`,
        },
      },
    },

    en: {
      label: 'English',
      lang: 'en-US',
      link: '/en/',
      title: 'CS Knowledge Wiki',
      description: 'A personal CS knowledge base: math, algorithms, Java, C++, databases.',
      themeConfig: {
        nav: [
          { text: 'Home', link: '/en/' },
          { text: 'Math', link: '/en/math/' },
          { text: 'Algorithms', link: '/en/algorithm/' },
          { text: 'ML', link: '/en/ml/' },
          { text: 'Java', link: '/en/java/' },
          { text: 'C++', link: '/en/cpp/' },
          { text: 'Database', link: '/en/database/' },
          { text: 'System Design', link: '/en/system-design/' },
          { text: 'About', link: '/en/about/' },
        ],
        sidebar: {
          '/en/math/': [
            { text: 'Math', items: [{ text: 'Overview', link: '/en/math/' }] },
          ],
          '/en/algorithm/': [
            { text: 'Algorithms', items: [{ text: 'Overview', link: '/en/algorithm/' }] },
          ],
          '/en/ml/': [
            { text: 'Machine Learning', items: [{ text: 'Overview', link: '/en/ml/' }] },
          ],
          '/en/java/': [
            { text: 'Java', items: [{ text: 'Overview', link: '/en/java/' }] },
          ],
          '/en/cpp/': [
            { text: 'C++', items: [{ text: 'Overview', link: '/en/cpp/' }] },
          ],
          '/en/database/': [
            { text: 'Database', items: [{ text: 'Overview', link: '/en/database/' }] },
          ],
          '/en/system-design/': [
            { text: 'System Design', items: [{ text: 'Overview', link: '/en/system-design/' }] },
          ],
        },
        footer: {
          message: 'Built with care.',
          copyright: `Copyright © ${new Date().getFullYear()} hswsp`,
        },
      },
    },
  },
})
