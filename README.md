# Group Dynamics Simulator

LLM-driven multi-agent simulation platform for studying group dynamics, game theory, and emergent social behaviors through interactive 3D visualization.

![CI](https://github.com/Runrun-mu/SIM/actions/workflows/ci.yml/badge.svg)

## Overview

This system uses Large Language Models (GPT-4o-mini by default) to drive autonomous agent decision-making in classic group dynamics scenarios. Each agent has a unique personality ("soul"), memory system, and resource attributes. Agents perceive their environment, make decisions through LLM reasoning, and interact with each other — producing emergent behaviors that can be observed and analyzed in real-time.

### Scenarios

| Scenario | Description | Key Metrics |
|----------|-------------|-------------|
| **Prisoner's Dilemma** | Agents choose to cooperate or defect in pairwise interactions | Cooperation rate, strategy distribution, cumulative scores |
| **Wealth Distribution** | Agents negotiate trades in a dynamic market | Gini coefficient, wealth distribution, Top 10% share |
| **Public Goods** | Contribute to a shared pool, free-rider problem | Average contribution, free-rider ratio, pool total |
| **Ultimatum Game** | Propose a split; accept or reject | Average offer, rejection rate |
| **Dictator Game** | Dictator decides the split | Average offer, generosity rate |
| **Hawk-Dove** | Aggressive vs peaceful strategies | Hawk rate, conflict rate, average resource gain |
| **Trust Game** | Invest and return, build trust | Average investment/return, trust index |
| **Minority Game** | Choose A or B, minority wins | Winner count, switch rate |
| **Tragedy of Commons** | Shared resource extraction dilemma | Resource pool, average extraction, sustainability index |
| **Axelrod Tournament** | Iterated PD round-robin tournament | Tournament scores, dominant strategy |
| **Schelling Segregation** | Agents prefer similar neighbors | Segregation index, satisfaction rate, move rate |
| **Voting Model** | Multi-round voting for candidates | Swing voter rate, winning candidate |
| **SIR Epidemic** | Disease spreading simulation | Susceptible/infected/recovered counts |
| **Social Influence** | Opinion dynamics and consensus | Consensus level, average opinion shift |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | **Bun** (runtime + package manager + test framework) |
| Monorepo | **Turborepo** (task orchestration + caching) |
| Backend | **Fastify** + **WebSocket** + **Vercel AI SDK** |
| LLM | **OpenAI GPT-4o-mini** (default, supports multi-model switching) |
| Frontend | **React 19** + **Vite 6** + **React Three Fiber** |
| State | **Zustand** |
| Styling | **Tailwind CSS** (cyberpunk dark theme + glassmorphism) |
| Charts | **Recharts** |
| Lint/Format | **Biome** (35x faster than ESLint + Prettier) |
| CI/CD | **GitHub Actions** + **Husky** pre-commit hooks |

## Architecture

```
packages/
  shared/     — Shared types + Zod schemas
  server/     — Simulation engine + LLM adapters + WebSocket API
  client/     — 3D visualization frontend (React + R3F)
specs/        — Design specs + daily task tracking
bug/          — Bug reports + fix records
rawasset/     — 3D art assets (CC0 character models + block tiles)
Docs/         — Technical documentation (modules, data structures, critical paths)
```

### Core Concepts

- **Agent**: Autonomous entity with personality (soul), memory, and resources. Decisions are made by LLM.
- **Memory System**: Short-term (recent interactions) + long-term (LLM-compressed summaries) memory.
- **Simulation Engine**: Tick-based execution — each tick: perceive → decide → interact → update.
- **Observatory**: Real-time metrics collection (Gini coefficient, cooperation rate, etc.).
- **Scenario Environment**: Pluggable scenario system defining interaction rules and payoff structures.

### Communication

Frontend ↔ Backend communication via WebSocket:
- Real-time tick updates with agent states, decisions, and metrics
- Control messages: start, pause, resume, stop, set-speed

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) >= 1.3.x
- An OpenAI API key (optional — mock mode available)

### Installation

```bash
# Clone the repository
git clone https://github.com/Runrun-mu/SIM.git
cd SIM

# Install dependencies
bun install
```

### Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your API key (optional)
# LLM_MOCK=true will use mock LLM (no API key needed)
```

**.env** variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_PROVIDER` | `openai` | LLM provider (openai / anthropic / ollama) |
| `OPENAI_API_KEY` | — | Your OpenAI API key |
| `LLM_MODEL` | `gpt-4o-mini` | Model to use |
| `LLM_MOCK` | `false` | Use mock LLM (no real API calls) |

### Running

```bash
# Start both frontend and backend in dev mode
bun run dev

# Frontend: http://localhost:5173
# Backend:  http://localhost:3001
# WebSocket: ws://localhost:3001/ws
```

### Mock Mode (No API Key)

```bash
# Run with mock LLM — great for development and testing
LLM_MOCK=true bun run dev
```

## Development

### Scripts

```bash
bun run dev          # Start dev servers (frontend + backend)
bun run build        # Build all packages
bun run lint         # Biome lint + format check
bun run lint:fix     # Auto-fix lint issues
bun run typecheck    # TypeScript type checking
bun run test         # Run all tests
bun run ci           # Full CI: lint → typecheck → test
bun run ci:full      # Full CI + build
```

### Testing Strategy

- **Mock-first**: All tests run with `LLM_MOCK=true` by default
- **Real API**: Manual verification with `LLM_MOCK=false`
- **Framework**: Bun's built-in test runner

### Commit Conventions

- [Conventional Commits](https://www.conventionalcommits.org/): `feat:` / `fix:` / `chore:` / `docs:` / `refactor:` / `test:`
- Pre-commit hook: biome check → typecheck → test

## 3D Assets

| Pack | Type | Count | License | Source |
|------|------|-------|---------|--------|
| Quaternius Character Pack | Animated characters | 45 models | CC0 | [@Quaternius](https://quaternius.com) |
| KayKit Block Bits 1.0 | Voxel terrain blocks | 40 models | CC0 | [KayKit](https://kaylousberg.com) |

Characters are loaded via `useGLTF()` from `@react-three/drei`, assigned deterministically per agent via djb2 hash.

## UI Design

**Dark cyberpunk theme with glassmorphism:**

- Background: `#0a0a0f` → `#1a1a2e` gradient
- Accent colors: Cyan `#00f0ff` / Purple `#7b2ff7` / Pink `#ff2d55`
- Panels: backdrop-blur + semi-transparent rgba
- Fonts: JetBrains Mono (data) + Inter (UI)
- Neon glow borders + chart effects

### Pages

1. **Scenario Select** — Choose from 14 simulation scenarios
2. **Character Create** — Create/edit/delete agents with custom personalities
3. **Simulation** — Real-time 3D visualization + timeline + dashboard + controls
4. **Multi Dashboard** — Compare results across multiple simulation runs

## Documentation

See [`agent.md`](agent.md) for the full project index, or browse detailed docs:

- [Technical Spec](Docs/spec.md) — Stack, workspace, scenarios, ports
- [Module Guide](Docs/modules.md) — All server/client/shared modules explained
- [Data Structures](Docs/data-structures.md) — Core type definitions
- [Critical Paths](Docs/critical-paths.md) — 7 key execution chains with sequence diagrams
- [Art Assets](Docs/art-assets.md) — Character model catalog + loading guide

## License

MIT
