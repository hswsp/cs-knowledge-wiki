import { defineConfig } from 'vitepress'
import { buildSidebar } from './sidebar.js'
import { mermaidMarkdown } from './mermaidPlugin.js'
import { mathMarkdown } from './mathPlugin.js'

const GITHUB_URL = 'https://github.com/hswsp/cs-knowledge-wiki'

export default defineConfig({
  title: 'CS Knowledge Wiki',
  description: 'A personal computer science knowledge base — math, algorithms, Java, C++, storage.',
  cleanUrls: true,
  lastUpdated: true,
  ignoreDeadLinks: true,

  markdown: {
    config: (md) => {
      mathMarkdown(md);
      mermaidMarkdown(md);
    },
  },

  head: [
    ['link', { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }],
    [
      'script',
      { id: 'MathJax-configuration' },
      `window.MathJax = {
        tex: {
          inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
          displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
          processEscapes: true,
        },
        options: {
          skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
        },
        startup: { typeset: true },
      };`,
    ],
    [
      'script',
      { id: 'MathJax-script', async: true, src: 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js' },
    ],
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
      description: '个人计算机知识库：数学 / 算法 / Java / C++ / 存储 / 系统设计 / 工具 / OS',
      themeConfig: {
        nav: [
          { text: '首页', link: '/' },
          { text: '数学', link: '/math/' },
          { text: '算法', link: '/algorithm/' },
          { text: '机器学习', link: '/ml/' },
          { text: 'Java', link: '/java/' },
          { text: 'C++', link: '/cpp/' },
          { text: 'Rust', link: '/rust/' },
          { text: '存储', link: '/storage/' },
          { text: '系统设计', link: '/system-design/' },
          { text: '工具', link: '/tools/' },
          { text: '计算机系统', link: '/csapp/' },
          { text: '信息安全', link: '/security/' },
          { text: '关于', link: '/about/' },
        ],
        sidebar: buildSidebar(),
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
      description: 'A personal CS knowledge base: math, algorithms, Java, C++, storage.',
      themeConfig: {
        nav: [
          { text: 'Home', link: '/en/' },
          { text: 'Math', link: '/en/math/' },
          { text: 'Algorithms', link: '/en/algorithm/' },
          { text: 'ML', link: '/en/ml/' },
          { text: 'Java', link: '/en/java/' },
          { text: 'C++', link: '/en/cpp/' },
          { text: 'Storage', link: '/en/storage/' },
          { text: 'System Design', link: '/en/system-design/' },
          { text: 'About', link: '/en/about/' },
        ],
        sidebar: {
                    '/en/math/': [
  { text: 'Math', items: [
    { text: 'Overview', link: '/en/math/' },
  ] },
],
          '/en/algorithm/': [
  { text: 'Algorithms', items: [
    { text: 'Overview', link: '/en/algorithm/' },
  ] },
],
          '/en/ml/': [
            { text: 'Machine Learning', items: [
                { text: 'Overview', link: '/en/ml/' },
            ] },
          ],'/en/java/': [
            { text: 'Java', items: [
                { text: 'Overview', link: '/en/java/' },
            ] },
          ],'/en/cpp/': [
            { text: 'C++', items: [
                { text: 'Overview', link: '/en/cpp/' },
                { text: 'C++输入输出处理', link: '/en/cpp/c-plus-plus-输入输出处理' },
                { text: 'C++11常用新特性（一）', link: '/en/cpp/c-plus-plus-11常用新特性一' },
                { text: 'C++11常用新特性（二）', link: '/en/cpp/c-plus-plus-11常用新特性二' },
                { text: 'C++ 正则表达式', link: '/en/cpp/c-plus-plus-正则表达式' },
                { text: 'C++ string', link: '/en/cpp/c-plus-plus-string' },
                { text: 'C++ vector容器', link: '/en/cpp/c-plus-plus-vector容器' },
                { text: 'C++ pair', link: '/en/cpp/c-plus-plus-pair' },
                { text: 'C++ set', link: '/en/cpp/c-plus-plus-set' },
                { text: 'C++ map', link: '/en/cpp/c-plus-plus-map' },
                { text: 'C++ 关联容器排序', link: '/en/cpp/c-plus-plus-关联容器排序' },
                { text: 'C++ 容器适配器', link: '/en/cpp/c-plus-plus-容器适配器' },
                { text: 'C++ algorithm函数简介', link: '/en/cpp/c-plus-plus-algorithm函数简介' },
                { text: 'C++ 查找与排序', link: '/en/cpp/c-plus-plus-查找与排序' },
            ] },
          ],'/en/system-design/': [
            { text: 'System Design', items: [
                { text: 'Overview', link: '/en/system-design/' },
            ] },
          ],},
        footer: {
          message: 'Built with care.',
          copyright: `Copyright © ${new Date().getFullYear()} hswsp`,
        },
      },
    },
  },
})
