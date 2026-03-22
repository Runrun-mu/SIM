# 关键链路

## 1. 模拟启动链路

```
用户点击 "Start Simulation"
  → Simulation.tsx: wsClient.send({ type: 'start-simulation', config, agents })
  → ws/handler.ts: SimulationHandler.handleMessage()
    → WSMessageToServerSchema.safeParse() 校验
    → startSimulation(config, agents)
      → createEnvironment(config) — switch(config.type) 分发 14 种 Environment
      → new SimulationEngine(config, identities, environment, llm, { onTick })
        → identities.map(id => new Agent(id, llm))
      → engine.start()
  → ws.send({ type: 'simulation-started' })
  → Client: handleWSMessage → set({ status: 'running' })
```

## 2. Tick 执行链路 (核心循环)

```
SimulationEngine.start() — while(running && tick < maxTicks):

  ┌──────────────────────────────────────────┐
  │ 1. environment.executeTick(agents, tick)  │
  │    ┌──────────────────────────────────┐   │
  │    │ a. pairAgents() 随机配对          │   │
  │    │ b. agentA.perceive("matched...")  │   │
  │    │ c. agentB.perceive("matched...")  │   │
  │    │ d. Promise.all([                  │   │
  │    │      agentA.decide(prompt, tick), │   │ ← 15s 超时
  │    │      agentB.decide(prompt, tick)  │   │
  │    │    ])                             │   │
  │    │ e. parseAction() 解析 JSON 决策   │   │
  │    │ f. computePayoff(actionA, actionB)│   │
  │    │ g. agent.updateResources(delta)   │   │
  │    │ h. agent.perceive("Outcome: ...") │   │
  │    │ i. createInteraction() 记录       │   │
  │    └──────────────────────────────────┘   │
  │ 2. environment.computeMetrics()           │
  │ 3. TickMetrics 构造                        │
  │ 4. history.push(metrics)                  │
  │ 5. tickCallback(metrics) → ws.send(tick)  │
  │ 6. sleep(tickDelay)                       │
  └──────────────────────────────────────────┘

  ↓ (catch: 单 tick 失败不崩溃, 继续下一 tick)
```

## 3. Agent 决策链路

```
Agent.decide(prompt, tick):
  1. memory.toPrompt() → 格式化记忆上下文
  2. systemPrompt = soul + resources + memoryContext
  3. Promise.race([
       llm.generate({ systemPrompt, messages }),
       15s timeout → reject
     ])
  4. 失败 → fallback: { action: 'cooperate' }
  5. memory.add(decision, 'action', tick)
  6. 每 5 tick → memory.consolidate(llm)
       → LLM 摘要短期记忆 → 写入长期 → 清空短期
  7. return response.content
```

## 4. 记忆压缩链路

```
Memory.consolidate(llm):
  1. 短期记忆 → 拼接文本
  2. llm.generate({
       system: "You are a memory consolidation system...",
       user: "Please consolidate these memories: ..."
     })
  3. LLM 返回 2 句摘要
  4. 写入 longTerm (importance=0.8, type='reflection')
  5. trim longTerm if > 50
  6. 清空 shortTerm
```

## 5. 实时数据推送链路

```
Server tick callback:
  observatory.record(metrics)
  ws.send({ type: 'tick', data: metrics })
    ↓
Client WebSocket:
  handleWSMessage(msg)
  → case 'tick': set({ tickHistory: [...prev, msg.data], currentTick })
    ↓
React 渲染:
  AgentGraph → 读取 agents + tickHistory → AgentNode 位置/模型/选中态
  Dashboard → 读取 tickHistory → Recharts 图表
  Timeline → 读取 tickHistory → 交互日志
  CharacterPanel → 读取 selectedAgentId + agentStates → 详情
```

## 6. LLM 适配降级链路

```
createLLMAdapter():
  1. 检查 LLM_MOCK=true → MockLLMAdapter
  2. 检查 API key (OPENAI_API_KEY || ANTHROPIC_API_KEY)
     - 有 key → RealLLMAdapter (Vercel AI SDK)
     - 无 key → console.warn + MockLLMAdapter(random)

MockLLMAdapter.generate():
  1. 分析 systemPrompt + lastMessage 内容
  2. 关键词匹配 → 14 种场景各有对应的 mock 响应格式
  3. 4 种策略: random / always-cooperate / always-defect / tit-for-tat
  4. 返回 JSON 格式响应 (与真实 LLM 格式一致)
```

## 7. 3D 渲染链路

```
AgentGraph (R3F Canvas):
  ├─ ambientLight + pointLight × 2 (cyan/purple)
  ├─ Stars (背景星空)
  ├─ agents.map() → AgentNode
  │    ├─ getModelForAgent(agentId) — djb2 hash → 45 种角色之一
  │    ├─ useGLTF(/models/characters/{name}.gltf)
  │    ├─ scene.clone() + MeshToonMaterial 覆盖
  │    ├─ Suspense fallback: 半透明八面体
  │    ├─ useFrame: 浮动动画 + 慢速旋转
  │    ├─ Text (名称标签)
  │    └─ ringGeometry (选中光环)
  ├─ InteractionLines — bufferGeometry 连线
  ├─ gridHelper (地面网格)
  └─ OrbitControls (拖拽/缩放/自动旋转)
```
