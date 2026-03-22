## Bug #2: ReactCurrentOwner 报错导致白屏

**状态**: ✅ 已修复

**描述**:
浏览器控制台报错：
```
Uncaught TypeError: Cannot read properties of undefined (reading 'ReactCurrentOwner')
    at $$reconciler (chunk-OR3KVBWQ.js?v=cf14da52:906:54)
```
导致 React 完全无法渲染，页面全白。

**根因分析**:
`@react-three/fiber@8.18.0` 的 peerDependency 要求 `react >=18 <19`，
但项目安装的是 `react@19.2.4`。R3F v8 内部引用了 React 18 的内部 API
（`ReactCurrentOwner`），在 React 19 中该 API 已被移除/重构，
导致运行时崩溃，React 无法挂载任何组件。

**解决方案**:
升级 R3F 到兼容 React 19 的版本：
- `@react-three/fiber`: 8.18.0 → **9.5.0**
- `@react-three/drei`: 9.122.0 → **10.7.7**

同时需要清除 Vite 缓存（`rm -rf node_modules/.vite`）并重启 dev server。

**修复时间**: 2026-03-22
