# Config Studio — How to create Network Map, Typology and Rules

This guide explains how to create and manage configuration records used by Config Studio: Network Map, Typology, and Rule. It covers the UI flows in the frontend and the equivalent backend API calls with minimal working JSON examples.

**Quick overview**

- UI pages: Use the web frontend and go to Dashboard → Manage Network Map / Typology / Rule
- API base path (backend proxy): `/config` (frontend uses `API_BASE_URL` + these endpoints)
  - Network Map: `/config/network-map`
  - Rule: `/config/rule`
  - Typology: `/config/typology`

**Notes**

- `tenantId` is injected from the frontend authentication context and must match your tenant.
- `id` for new records is automatically prefixed in the UI for rules and typologies with the tenant prefix shown in the form (e.g. `tenant-001-` or `tenant-xxx-typology-`).
- `cfg` is the configuration version (e.g. `1.0.0`, `999@1.0.0` in examples). For network map the primary key is `cfg` only.
- `creDtTm` and `updDtTm` are injected by the backend on create/update.

---

**1) Create a Rule (UI)**

- Open the frontend and navigate to: Manage → Rule Configuration.
- Click `Create New`.
- Fill `ID` (the UI will prepend the tenant prefix), `Config Version` (e.g. `1.0.0`), `Description`.
- In the `Config` section use the form builder to pick `Config Type` (Bands or Cases), add `Parameters`, `Exit Conditions`, `Timeframes`, and `Bands` or `Cases`.
- The UI shows a JSON preview. Click `Create`.

Equivalent API (POST /config/rule)

- URL: POST <API_BASE_URL>/config/rule
- Body (minimal working example):

{
"id": "tenant-001-901@1.0.0",
"cfg": "1.0.0",
"desc": "Number of outgoing transactions - debtor",
"config": {
"parameters": { "maxQueryRange": 86400000 },
"exitConditions": [{ "subRuleRef": ".x00", "reason": "Incoming transaction is unsuccessful" }],
"bands": [
{ "subRuleRef": ".01", "reason": "one transaction", "upperLimit": 2 },
{ "subRuleRef": ".02", "reason": "two transactions", "lowerLimit": 2, "upperLimit": 3 },
{ "subRuleRef": ".03", "reason": "three or more", "lowerLimit": 3 }
]
}
}

Response: 201 Created with stored object (backend will add `creDtTm`/`updDtTm`).

Validation tips

- `id`, `cfg`, and `desc` are required.
- `config` must be valid JSON. For `bands` mode provide at least one band. For `cases` mode provide at least one expression or an alternative.

---

**2) Create a Typology (UI)**

- Navigate to Manage → Typology Configuration.
- Click `Create New`.
- Fill `ID`, `Config Version`, `Description`.
- Under `Rules` click `Add Rule` to select existing rule IDs (dropdown loads rule list) and set `Term Id` and `Weights` for each rule.
- Compose the `Expression` (first item must be an operation like `Add`, subsequent items are `termId` values from rules above).
- Set `Workflow` fields: `Alert Threshold`, `Interdiction Threshold` and `Flow Processor` (rule id that acts as flow processor).
- Click `Create`.

Equivalent API (POST /config/typology)

- URL: POST <API_BASE_URL>/config/typology
- Body (minimal working example based on your example):

{
"id": "tenant-001-typology-001@1.0.0",
"cfg": "999@1.0.0",
"desc": "Typology-999-Rule-901-and-902",
"tenantId": "tenant-001",
"rules": [
{
"id": "901@1.0.0",
"cfg": "1.0.0",
"wghts": [
{ "ref": ".err", "wght": 0 },
{ "ref": ".x00", "wght": 100 },
{ "ref": ".01", "wght": 100 },
{ "ref": ".02", "wght": 200 },
{ "ref": ".03", "wght": 400 }
],
"termId": "v901at100at100"
},
{
"id": "902@1.0.0",
"cfg": "1.0.0",
"wghts": [
{ "ref": ".err", "wght": 0 },
{ "ref": ".x00", "wght": 100 },
{ "ref": ".01", "wght": 100 },
{ "ref": ".02", "wght": 200 },
{ "ref": ".03", "wght": 400 }
],
"termId": "v902at100at100"
}
],
"workflow": {
"flowProcessor": "EFRuP@1.0.0",
"alertThreshold": 30,
"interdictionThreshold": 50
},
"expression": ["Add", "v901at100at100", "v902at100at100"]
}

Response: 201 Created.

Validation tips

- Each rule entry should reference an existing rule id@cfg (create rules first).
- `termId` must be unique per rule within the typology and used in `expression`.
- `expression` items: first is operation, following are `termId` names.

---

**3) Create a Network Map (UI)**

- Navigate to Manage → Network Map Configuration.
- Click `Create New` (or Edit existing) and provide `name`, `cfg` (config version), `messages` array where each message links `txTp` to typologies.
- Use `Activate` to set a network map active (this calls the backend activate endpoint).

Equivalent API (POST /config/network-map)

- URL: POST <API_BASE_URL>/config/network-map
- Body (minimal working example):

{
"cfg": "1.0.0",
"name": "Public Network Map",
"active": true,
"messages": [
{
"id": "004@1.0.0",
"cfg": "1.0.0",
"txTp": "pacs.002.001.12",
"typologies": [
{
"id": "tenant-001-typology-001@1.0.0",
"cfg": "999@1.0.0",
"rules": [
{ "id": "EFRuP@1.0.0", "cfg": "none" },
{ "id": "901@1.0.0", "cfg": "1.0.0" },
{ "id": "902@1.0.0", "cfg": "1.0.0" }
],
"tenantId": "tenant-001"
}
]
}
],
"tenantId": "tenant-001"
}

After creating a network map, call the activate endpoint if needed:
POST <API_BASE_URL>/config/network-map/1.0.0/activate
Body: { "reloadMode": "none" }

---

**Useful API endpoints (frontend proxy)**

- List: GET /config/{table}?limit=&offset=&sort=&order=&filters=
  - Example: GET /config/rule?limit=20&offset=0
- Get by id/cfg:
  - Rule/Typology: GET /config/{table}/{id}/{cfg}
  - Network map: GET /config/network-map/{cfg}
- Create: POST /config/{table}
- Update: PUT /config/{table}/{id}/{cfg} (or /config/network-map/{cfg} for network_map)
- Delete: DELETE /config/{table}/{id}/{cfg} (or /config/network-map/{cfg})
- Activate network map: POST /config/network-map/{cfg}/activate
- Deactivate: POST /config/network-map/{cfg}/deactivate
- Reload: POST /config/network-map/reload

---

**Advanced: Troubleshooting and raw data**

- If you want to check raw records, you can query the backend endpoints directly using `curl` or Postman. The frontend `Typology` editor fetches rule options from `/config/rule` to populate the dropdown.

Example curl (replace AUTH_TOKEN and API_BASE_URL):

curl -X POST "${API_BASE_URL}/config/rule" \
 -H "Authorization: Bearer ${AUTH_TOKEN}" \
 -H "Content-Type: application/json" \
 -d '@rule.json'

- When editing typologies, ensure rule `id@cfg` strings match existing rule records (the UI dropdown helps).

---

If you want, I can:

- Add copy-paste `curl` commands for each example with placeholders.
- Run a quick smoke test against the services on your machine (you provided SSH and docker info) — I would need you to confirm and provide the auth token or run commands from your side.
