# Result Template

Canonical Markdown structure for presenting H0 API test results. Fill `{{PLACEHOLDERS}}` with values parsed in Step 4. Use the matching branch example (§Branch Examples) for non-success cases.

## Verdict Table

| Status class | Verdict |
|---|---|
| 2xx | ✅ 成功 |
| 3xx | ↪️ 重定向 |
| 4xx | ⚠️ 客户端错误 |
| 5xx | ❌ 服务器错误 |

If the request was retried after a 401, prepend to the verdict: `⚠️ 首次 401，已重新获取 token 并重试一次 — `

## Variable Reference

| Placeholder | Source | Example |
|---|---|---|
| `{{VERDICT}}` | verdict table, by status class | `✅ 成功` |
| `{{METHOD}}` | parsed method | `POST` |
| `{{PATH}}` | api path (service_prefix + api_path) | `/hzero-demo-12345/v1/1/orders` |
| `{{STATUS_CODE}}` | headers status line, field 2 | `201` |
| `{{STATUS_TEXT}}` | headers status line, field 3+ | `Created` |
| `{{TIME_TOTAL}}` | metrics field `time_total` | `0.235` |
| `{{SIZE_DOWNLOAD}}` | metrics field `size_download` | `412` |
| `{{SIZE_UPLOAD}}` | metrics field `size_upload` | `89` |
| `{{FULL_URL}}` | base_url + service_prefix + api_path | `https://hz.example.com/hzero-demo-12345/v1/1/orders` |
| `{{TOKEN_MASKED}}` | `${ACCESS_TOKEN:0:12}***` | `eyJhbGciOi***` |
| `{{USERNAME}}` | config `username` | `admin` |
| `{{REQUEST_HEADERS}}` | headers actually sent | `Content-Type: application/json` |
| `{{REQUEST_BODY_PRETTY}}` | request body, JSON pretty-printed (2-space) | — |
| `{{RESPONSE_HEADERS_KEY}}` | key response headers, one `- key: value` line each, ≤8 | — |
| `{{BODY_PRETTY}}` | response body, JSON pretty-printed (2-space) or raw fenced | — |
| `{{CURL_REPRO}}` | reconstructed curl with `<TOKEN>` placeholder | — |
| `{{SANITIZED_PATH}}` | URL path with `/`→`-`, no query string | `v1-1-orders` |
| `{{YYYYMMDD-HHMMSS}}` | local timestamp | `20260626-100530` |

## Inline Result Skeleton (default — detailed)

Emit the lines below as the chat message, with every `{{PLACEHOLDER}}` filled from parsed values:

````
### {{VERDICT}} · {{METHOD}} {{PATH}}

| 项 | 值 |
|---|---|
| 状态码 | **{{STATUS_CODE}} {{STATUS_TEXT}}** |
| 耗时 | {{TIME_TOTAL}} s |
| 响应 / 请求大小 | {{SIZE_DOWNLOAD}} B / {{SIZE_UPLOAD}} B |

**请求**
- Method：`{{METHOD}}`
- URL：`{{FULL_URL}}`
- Auth：`Bearer {{TOKEN_MASKED}}`（{{USERNAME}}）
- Headers：`{{REQUEST_HEADERS}}`
- Body：
  ```json
  {{REQUEST_BODY_PRETTY}}
  ```

**响应头**（关键）
{{RESPONSE_HEADERS_KEY}}

**响应体**
```json
{{BODY_PRETTY}}
```

**复现**
```bash
{{CURL_REPRO}}
```
💡 `<TOKEN>` 需重新获取（见 Step 3）；完整 token 仅存于本次会话内存，不落盘。
````

## Save-File Layout

When saving (body > 200 lines / user asks / non-2xx), write the Inline Result Skeleton PLUS these extra sections at the end:

- `## 完整响应头` — every response header line, raw
- `## 完整响应体` — full response body (no truncation), fenced
- `## 请求元信息` — timestamp, full URL, curl exit code, raw metrics line

File path: `.claude/api-test-results/{{YYYYMMDD-HHMMSS}}-{{METHOD}}-{{SANITIZED_PATH}}.md`

In the inline report, after the header line, add: `> 完整结果已保存：{{path}}`

## Branch Examples

### A. 2xx success (JSON)

### ✅ 成功 · POST /hzero-demo-12345/v1/1/orders

| 项 | 值 |
|---|---|
| 状态码 | **201 Created** |
| 耗时 | 0.235 s |
| 响应 / 请求大小 | 412 B / 89 B |

**请求**
- Method：`POST`
- URL：`https://hz.example.com/hzero-demo-12345/v1/1/orders`
- Auth：`Bearer eyJhbGciOi***`（admin）
- Headers：`Content-Type: application/json`
- Body：
  ```json
  {"orderNo":"TEST-001","customerCode":"TEST"}
  ```

**响应头**（关键）
- `Content-Type: application/json`
- `Content-Length: 412`
- `Date: Thu, 26 Jun 2026 10:00:00 GMT`

**响应体**
```json
{
  "id": 10086,
  "orderNo": "TEST-001",
  "tenantId": 1
}
```

**复现**
```bash
curl -X POST 'https://hz.example.com/hzero-demo-12345/v1/1/orders' \
  -H 'Authorization: Bearer <TOKEN>' -H 'Content-Type: application/json' \
  -d '{"orderNo":"TEST-001","customerCode":"TEST"}'
```
💡 `<TOKEN>` 需重新获取（见 Step 3）；完整 token 仅存于本次会话内存，不落盘。

### B. 4xx client error (append hint table)

Same skeleton, verdict `⚠️ 客户端错误`. After the curl repro, append the status-code hint table (see SKILL.md Step 5 §Status Code Interpretation). Example header:

### ⚠️ 客户端错误 · GET /hzero-demo-12345/v1/1/orders/9999

(status 404 → body shows server error JSON; hint table notes "检查 URL 路径和资源 ID")

### C. 5xx HTML error page (auto-save)

Verdict `❌ 服务器错误`. Body is HTML → fenced as an http code block (first 20 lines) + the line `服务端返回 HTML 错误页，建议查后端日志`. Auto-save full detail; inline shows:
> 完整结果已保存：.claude/api-test-results/20260626-100530-GET-v1-1-orders-9999.md

### D. curl network failure

### ❌ 请求失败 · POST /hzero-demo-12345/v1/1/orders

- curl exit code: 7
- stderr: `Failed to connect to hz.example.com port 443`
- 常见原因：主机不可达 / DNS 解析失败 / 超时（可加 `--max-time 30`）/ 自签证书（可加 `-k`，仅限开发环境）

### E. Large response (> 200 lines, JSON)

Inline body shows first 50 lines then:
`…（共 N 行，完整内容已保存：.claude/api-test-results/<ts>-GET-<path>.md）`
Full body lives only in the saved file.
