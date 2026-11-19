// 固化 UNI_INPUT_DIR：项目为根目录结构，uni CLI 默认找 src/，需指向项目根
const path = require('path')
const { spawnSync } = require('child_process')

process.env.UNI_INPUT_DIR = process.env.UNI_INPUT_DIR || path.resolve(__dirname, '..')

const uniBin = path.resolve(__dirname, '../node_modules/@dcloudio/vite-plugin-uni/bin/uni.js')
const r = spawnSync(process.execPath, [uniBin, ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: process.env
})
process.exit(r.status === null ? 1 : r.status)
