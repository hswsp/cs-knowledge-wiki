#!/usr/bin/env node
/**
 * 用兼容的 Node 版本运行 Astro 构建。
 *
 * 背景：Cloudflare Pages 的 Node 版本由项目环境变量 `NODE_VERSION` 决定，
 * 它的优先级高于仓库里的 `.nvmrc`。如果那个变量被设成了 20（本项目 VitePress
 * 时期的遗留），Astro 6 会直接拒绝启动：
 *
 *   Node.js v20.20.0 is not supported by Astro!
 *   Please upgrade Node.js to a supported version: ">=22.12.0"
 *
 * 与其反复去 dashboard 改设置，这里做一层兜底：当前 Node 够新就直接跑；
 * 不够新就用 `npx node@24` 提供的二进制重新执行，绕开环境变量。
 */
import { spawnSync } from 'node:child_process'

const REQUIRED = [22, 12]
const ASTRO_BIN = 'node_modules/astro/bin/astro.mjs'

const [major, minor] = process.versions.node.split('.').map(Number)
const supported = major > REQUIRED[0] || (major === REQUIRED[0] && minor >= REQUIRED[1])

if (supported) {
  console.log(`[astro-build] Node ${process.versions.node} 满足要求，直接构建`)
  run(process.execPath, [ASTRO_BIN, 'build'])
} else {
  console.log(
    `[astro-build] Node ${process.versions.node} 低于 ${REQUIRED.join('.')}，` +
      '改用 npx node@24 重新执行'
  )
  run('npx', ['-y', 'node@24', ASTRO_BIN, 'build'])
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit' })
  if (result.error) {
    console.error(`[astro-build] 启动失败: ${result.error.message}`)
    process.exit(1)
  }
  process.exit(result.status ?? 1)
}
