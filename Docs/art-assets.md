# 美术资源索引

## 角色包: Quaternius Ultimate Animated Character Pack

- **来源**: Quaternius (CC0 许可, 免费商用)
- **格式**: glTF / FBX / OBJ / Blend
- **位置**: `rawasset/Ultimate Animated Character Pack - Nov 2019/`
- **引用**: `packages/client/public/models/characters/` → symlink → `rawasset/.../glTF/`

## 角色清单 (45 种)

### 日常角色
| 文件名 | 描述 |
|--------|------|
| Casual_Male | 休闲装男性，短发 |
| Casual_Female | 休闲装女性，长发 |
| Casual_Bald | 休闲装光头男性 |
| Casual2_Male | 休闲装2男性，帽衫 |
| Casual2_Female | 休闲装2女性 |
| Casual3_Male | 休闲装3男性 |
| Casual3_Female | 休闲装3女性 |

### 职业角色
| 文件名 | 描述 |
|--------|------|
| Suit_Male | 西装男性，商务风 |
| Suit_Female | 西装女性，商务风 |
| Chef_Male | 厨师男性，白帽围裙 |
| Chef_Female | 厨师女性 |
| Doctor_Male_Young | 年轻男医生，白大褂 |
| Doctor_Female_Young | 年轻女医生 |
| Doctor_Male_Old | 年长男医生 |
| Doctor_Female_Old | 年长女医生 |
| Worker_Male | 工人男性，安全帽 |
| Worker_Female | 工人女性 |
| OldClassy_Male | 绅士男性，正装 |
| OldClassy_Female | 绅士女性，正装 |

### 西部/牛仔
| 文件名 | 描述 |
|--------|------|
| Cowboy_Male | 牛仔男性，牛仔帽 |
| Cowboy_Female | 牛仔女性 |

### 奇幻角色
| 文件名 | 描述 |
|--------|------|
| Knight_Male | 骑士男性，铁甲 |
| Knight_Golden_Male | 金甲骑士男性 |
| Knight_Golden_Female | 金甲骑士女性 |
| Wizard | 法师，长袍尖帽 |
| Witch | 女巫，暗色长袍 |
| Elf | 精灵，尖耳绿装 |
| Viking_Male | 维京男性，角盔 |
| Viking_Female | 维京女性 |
| Goblin_Male | 哥布林男性，绿皮 |
| Goblin_Female | 哥布林女性 |

### 忍者
| 文件名 | 描述 |
|--------|------|
| Ninja_Male | 忍者男性，黑装 |
| Ninja_Female | 忍者女性，黑装 |
| Ninja_Sand | 沙忍男性，棕装 |
| Ninja_Sand_Female | 沙忍女性 |

### 海盗
| 文件名 | 描述 |
|--------|------|
| Pirate_Male | 海盗男性，眼罩 |
| Pirate_Female | 海盗女性 |

### 军人
| 文件名 | 描述 |
|--------|------|
| Soldier_Male | 士兵男性，迷彩绿 |
| Soldier_Female | 士兵女性 |
| BlueSoldier_Male | 蓝装士兵男性 |
| BlueSoldier_Female | 蓝装士兵女性 |

### 和服
| 文件名 | 描述 |
|--------|------|
| Kimono_Male | 和服男性 |
| Kimono_Female | 和服女性 |

### 僵尸
| 文件名 | 描述 |
|--------|------|
| Zombie_Male | 僵尸男性，破烂衣物 |
| Zombie_Female | 僵尸女性 |

## 模型加载方式

```typescript
// AgentNode.tsx
const modelName = getModelForAgent(agentId); // djb2 hash 确定性选择
const { scene } = useGLTF(`/models/characters/${modelName}.gltf`);
// clone + MeshToonMaterial 覆盖，保持卡通一致性
```

## 样式处理

- 所有模型统一覆盖 `MeshToonMaterial` (卡通着色器)
- 颜色保留原始模型颜色 (通过 `oldMat.color.clone()`)
- 选中/悬停时 emissive 高亮 (agent 主题色)
- 缩放基于 wealth: `scale = 0.3 + (wealth / 200) * 0.7`
