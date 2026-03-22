## Bug #1: 页面全白，没有界面

**状态**: ✅ 已修复

**描述**:
运行后进入端口 http://localhost:5173
发现为全白，没有界面

**截图**: ![alt text](image.png)

**根因分析**:
端口 5173 被另一个 Vite 项目 (`/Users/reeseewang/Downloads/simulator/`) 占用。
当用户访问 `http://localhost:5173` 时，实际加载的是那个项目的空白页面，
而非本项目的 Group Dynamics Simulator 前端。

**解决方案**:
1. 终止占用端口的旧进程 (`kill 86376`)
2. 重新启动本项目的 Vite 开发服务器 (`bun run dev`)
3. 确认 `http://localhost:5173` 正确显示 Group Dynamics Simulator 首页

**修复时间**: 2026-03-22

**预防措施**:
- 启动前检查端口占用: `lsof -i:5173`
- 如端口被占用，先释放端口再启动
