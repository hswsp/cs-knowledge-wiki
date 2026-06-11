import { defineConfig } from 'vitepress'

// Shared social links / theme bits
const GITHUB_URL = 'https://github.com/hswsp/cs-knowledge-wiki'

export default defineConfig({
  title: 'CS Knowledge Wiki',
  description: 'A personal computer science knowledge base — math, algorithms, Java, C++, databases.',
  cleanUrls: true,
  lastUpdated: true,
  // 迁移自旧 Hexo 博客的文章里包含一些 localhost 占位与外部锚点，先放行死链检查
  ignoreDeadLinks: true,

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
      description: '个人计算机知识库：数学 / 算法 / Java / C++ / 数据库 / 系统设计 / 工具 / OS',
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
          { text: '工具', link: '/tools/' },
          { text: 'OS', link: '/os/' },
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
            {
              text: 'Java 基础',
              collapsed: false,
              items: [
                { text: 'Java SPI 机制', link: '/java/basics/java-spi' },
                { text: 'Json 与 JavaBean 匹配', link: '/java/basics/json-javabean' },
              ],
            },
            {
              text: 'JVM',
              collapsed: false,
              items: [
                { text: '阅读 Java 字节码', link: '/java/jvm/java-bytecode' },
                { text: 'JVM CPU 飙高排查', link: '/java/jvm/troubleshoot-high-cpu' },
              ],
            },
            {
              text: '并发编程',
              collapsed: false,
              items: [
                { text: 'ThreadGroup', link: '/java/concurrent/thread-group' },
              ],
            },
            {
              text: 'Spring',
              collapsed: false,
              items: [
                { text: 'Spring Cloud 简介', link: '/java/spring/spring-cloud-intro' },
              ],
            },
          ],
          '/cpp/': [
            { text: 'C++', items: [{ text: '概览', link: '/cpp/' }] },
            {
              text: '构建',
              collapsed: false,
              items: [
                { text: 'CMake 简单入门', link: '/cpp/build/cmake-link' },
              ],
            },
          ],
          '/database/': [
            { text: '数据库', items: [{ text: '概览', link: '/database/' }] },
            {
              text: '分布式存储',
              collapsed: false,
              items: [
                { text: 'HDFS 简介', link: '/database/distributed-storage/hdfs-intro' },
              ],
            },
            {
              text: '存储引擎',
              collapsed: false,
              items: [
                { text: 'LSM Tree', link: '/database/storage-engine/lsm-tree' },
              ],
            },
          ],
          '/system-design/': [
            { text: '系统设计', items: [{ text: '概览', link: '/system-design/' }] },
            {
              text: '分布式共识',
              collapsed: false,
              items: [
                { text: 'Basic Paxos', link: '/system-design/distributed-consensus/basic-paxos' },
                { text: 'Multi-Paxos', link: '/system-design/distributed-consensus/multi-paxos' },
                { text: 'Raft（一）领导者选举', link: '/system-design/distributed-consensus/raft-1-leader-election' },
                { text: 'Raft（二）日志复制与压缩', link: '/system-design/distributed-consensus/raft-2-log-replication' },
                { text: 'Raft（三）成员变更', link: '/system-design/distributed-consensus/raft-3-membership-change' },
                { text: 'MIT 6.824 Lab 2 Raft', link: '/system-design/distributed-consensus/mit-6824-lab2-raft' },
              ],
            },
            {
              text: '消息队列',
              collapsed: false,
              items: [
                { text: 'Kafka 实践踩坑', link: '/system-design/messaging/kafka-practice' },
              ],
            },
          ],
          '/tools/': [
            { text: '工具', items: [{ text: '概览', link: '/tools/' }] },
            {
              text: 'Git',
              collapsed: false,
              items: [
                { text: 'Cherry-Pick', link: '/tools/git/cherry-pick' },
                { text: 'git merge 三种操作', link: '/tools/git/git-merge' },
                { text: 'GitHub 与 Gitee 共存', link: '/tools/git/github-gitee' },
                { text: '在 GitHub 上找项目', link: '/tools/git/search-in-git' },
              ],
            },
            {
              text: '搜索',
              collapsed: false,
              items: [
                { text: 'Lucene 语法查询', link: '/tools/search/lucene-grammar' },
              ],
            },
            {
              text: '博客',
              collapsed: false,
              items: [
                { text: 'GitHub Pages + Hexo', link: '/tools/blog/hexo-tutorial' },
                { text: 'Hexo + Kaze + Gitee', link: '/tools/blog/hexo-kaze-gitee' },
              ],
            },
          ],
          '/os/': [
            { text: '操作系统', items: [{ text: '概览', link: '/os/' }] },
            {
              text: 'Linux',
              collapsed: false,
              items: [
                { text: 'Linux PV/LV/VG', link: '/os/linux/linux-lvm' },
              ],
            },
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
