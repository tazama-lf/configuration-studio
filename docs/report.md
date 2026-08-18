# Config Studio vs TMS Configuration DB — Structural Report

**Source of truth:** live Postgres `configuration` DB at `10.0.115.104:5433`
**Sampled:** all rows — 34 rules, 31 typologies, 2 network maps
**Under test:** config-studio editor + backend at [config-studio](../home/ak/workspace/config-studio)

Every payload lives in a `configuration` jsonb column. "REQ" = present in 100% of rows, "OPT" = present in some rows only.

---

## 1. Rules — DB shape (n=34)

Required:
- `id` (string)
- `cfg` (string)
- `desc` (string)
- `tenantId` (string)
- `creDtTm` (string)
- `updDtTm` (string)
- `config.exitConditions` (array, may be empty)

Optional (frequency shown):
- `config.parameters` — 33/34 (only 1 rule omits it entirely)
  - inside: `maxQueryRange` (10), `tolerance` (6), `commission` (2), `evaluationIntervalTime` (2), `maxQueryLimit` (2), `minimumNumberOfTransactions` (2), `maxQueryRangeUpstream` (1), `maxQueryRangeDownstream` (1), `maxRadius` (1)
- `config.bands` — 32/34 (band-style rules only)
  - inside: `subRuleRef`, `reason`, `lowerLimit?`, `upperLimit?`
- `config.cases` — 1/34 (case-style rules only)
  - inside: `alternative?{subRuleRef, reason}`, `expressions[{subRuleRef, reason, value}]`
- `config.exitConditions[].subRuleRef` / `.reason` — 23/34 (rest are empty arrays)

Not present in any of 34 rows:
- `config.timeframes`

### Rule — config-studio diffs

| Field                | DB   | Studio | Status |
|----------------------|------|--------|--------|
| `id`,`cfg`,`desc`    | REQ  | emitted (id/cfg gated on non-empty) | OK |
| `tenantId`           | REQ  | emitted only if truthy — risk if unset | LOW-RISK |
| `creDtTm`, `updDtTm` | REQ  | server-injected on save ([config-proxy.service.ts:159-172](../home/ak/workspace/config-studio/backend/src/config/config-proxy.service.ts#L159-L172)) | OK |
| `config.parameters`  | REQ-ish (33/34) | always emitted | OK |
| `config.exitConditions` | REQ | always emitted | OK |
| `config.bands`       | conditional | emitted when `configType='bands'` | OK |
| `config.cases`       | conditional | emitted when `configType='cases'` | OK |
| `config.timeframes`  | never seen in DB | emitted when non-empty | ADDITIVE (new feature, backward-compatible) |

**Rule verdict: structurally compatible.** No blockers.

---

## 2. Typologies — DB shape (n=31)

Required (100%):
- `id`, `cfg`, `desc`, `tenantId`, `creDtTm`
- `workflow` object, always has `alertThreshold` (number)
- `rules[]` with `id`, `cfg`, `termId`, `wghts[]`
- `wghts[]` with `ref`, `wght`
- `expression[]` (array of strings)

Optional:
- `workflow.interdictionThreshold` — 8/31 (only ~26% of typologies)

Not present in any of 31 rows:
- `updDtTm`
- `workflow.flowProcessor`

### Typology — config-studio diffs

Studio emits ([TypologyConfigEditor.tsx:130-144](../home/ak/workspace/config-studio/frontend/src/features/config/components/TypologyConfigEditor.tsx#L130-L144)):
```
desc, id, cfg, tenantId, workflow{alertThreshold, interdictionThreshold, flowProcessor}, rules, expression
```

| Field                            | DB   | Studio | Diff |
|----------------------------------|------|--------|------|
| `id`,`cfg`,`desc`,`tenantId`     | REQ  | emitted | OK |
| `creDtTm`                        | REQ  | server-injected | OK |
| `updDtTm`                        | never | server-injected too | **EXTRA in studio** |
| `workflow.alertThreshold`        | REQ  | emitted | OK |
| `workflow.interdictionThreshold` | OPT (8/31) | always emitted | **EXTRA when unset** |
| `workflow.flowProcessor`         | never | always emitted (`""`) | **EXTRA in studio** |
| `rules[].{id,cfg,termId,wghts}`  | REQ  | emitted | OK |
| `expression[]`                   | REQ  | emitted | OK |

**Typology verdict: additive diffs only.** Studio output is a superset. Three real diffs:
1. `updDtTm` written to typology (DB never has it there)
2. `workflow.flowProcessor: ""` always present (DB never has it)
3. `workflow.interdictionThreshold` always present even when 0/unset (DB has it in only 8/31)

---

## 3. Network maps — DB shape (n=2)

Required (100%):
- `cfg`, `active`, `name`, `tenantId`, `creDtTm`
- `messages[]` with `id`, `cfg`, `txTp`, `typologies[]`
- `typologies[]` with `id`, `cfg`, `rules[]`
- `rules[]` with `id`, `cfg`

Not present in either row:
- `updDtTm`
- `messages[].typologies[].tenantId`
- `messages[].typologies[].rules[].tenantId`

### Network map — config-studio diffs

Studio emits ([NetworkMapConfigEditor.tsx:115-122](../home/ak/workspace/config-studio/frontend/src/features/config/components/NetworkMapConfigEditor.tsx#L115-L122)):
```
cfg, active, messages, tenantId
```

| Field                                     | DB   | Studio | Diff |
|-------------------------------------------|------|--------|------|
| `cfg`, `active`, `tenantId`               | REQ  | emitted | OK |
| `name`                                    | REQ  | **not emitted** | **MISSING in studio** |
| `creDtTm`                                 | REQ  | server-injected | OK |
| `updDtTm`                                 | never | server-injected | **EXTRA in studio** |
| `messages[].{id,cfg,txTp}`                | REQ  | emitted | OK |
| `messages[].typologies[].{id,cfg,rules}`  | REQ  | emitted | OK |
| `messages[].typologies[].tenantId`        | never | emitted at [NetworkMapConfigEditor.tsx:151](../home/ak/workspace/config-studio/frontend/src/features/config/components/NetworkMapConfigEditor.tsx#L151) | **EXTRA in studio** |
| `rules[].{id,cfg}`                        | REQ  | emitted | OK |

**Network map verdict: one blocker + additive diffs.**
1. **Missing `name`** — required by DB, not in editor at all
2. `updDtTm` written (DB never has it here)
3. Per-typology `tenantId` written (DB never has it there)

---

## Overall verdict per artifact

- **Rules:** compatible.
- **Typologies:** superset — extra fields don't break the DB but output isn't identical.
- **Network maps:** **`name` field is missing entirely.** Studio-saved network maps would be missing a field that all DB records have. Fix required.

## Required fixes to match DB shape

1. **Add `name` to the network map editor** and include it in the emitted payload ([NetworkMapConfigEditor.tsx:115-122](../home/ak/workspace/config-studio/frontend/src/features/config/components/NetworkMapConfigEditor.tsx#L115-L122)).
2. **Stop injecting `updDtTm` for typology and network_map** — restrict [config-proxy.service.ts:159-172](../home/ak/workspace/config-studio/backend/src/config/config-proxy.service.ts#L159-L172) to `rule` only, or drop `updDtTm` from those payloads before persisting.
3. **Remove per-typology `tenantId`** from network-map emission ([NetworkMapConfigEditor.tsx:151](../home/ak/workspace/config-studio/frontend/src/features/config/components/NetworkMapConfigEditor.tsx#L151)).
4. **Omit `flowProcessor` from typology `workflow`** when empty ([TypologyConfigEditor.tsx:136-140](../home/ak/workspace/config-studio/frontend/src/features/config/components/TypologyConfigEditor.tsx#L136-L140)) — or drop the field entirely if there's no plan to use it.
5. **Omit `workflow.interdictionThreshold`** when 0/unset (same lines) — DB only has it in 26% of typologies.
