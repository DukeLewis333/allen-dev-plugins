---
name: h0-api-tester
description: >
  Test H0 (hzero) platform API endpoints with automatic OAuth2 token authentication.
  Reads auth config from .claude/h0-auth.yaml, obtains an access token via password grant,
  then sends the actual API request with the token in the Authorization header. Supports
  GET, POST, PUT, DELETE methods with custom headers, query params, and request bodies.
  Use this skill when the user asks to "test an API", "call an endpoint", "verify an interface",
  "测试接口", "调用接口", "验证API", "接口测试", "请求这个接口", or wants to send HTTP
  requests to any H0/Hzero platform service. Also trigger on "curl this endpoint",
  "check if the API works", "api response", or when the user provides a URL and wants to
  see the response.
arguments: [api_request]
argument-hint: "[API endpoint URL or description, e.g. 'GET /v1/1/orders' or '测试订单保存接口 POST /v1/1/orders']"
allowed-tools: Read Glob Grep Bash(curl *) Bash(cat *) Bash(mkdir *)
---

# H0 API Tester

Test H0 platform API endpoints with automatic token authentication.

## Why This Skill Exists

Testing H0 platform APIs requires OAuth2 token authentication. Every request needs a valid `access_token` in the `Authorization` header. This skill automates the token retrieval process and provides a structured way to test any H0 endpoint directly from Claude Code.

## Prerequisites

The project must have a `.claude/h0-auth.yaml` configuration file. If it does not exist, create it (see below).

## Workflow

1. **Parse user input** — Extract HTTP method, URL path, and request body from the argument
2. **Read auth config** — Load credentials from `.claude/h0-auth.yaml`
3. **Obtain token** — Call the OAuth2 token endpoint
4. **Send request** — Execute the API call with the token
5. **Report results** — Display status code, response headers, and body

---

## Step 1: Parse User Input

The user provides the API to test via `$ARGUMENTS`. Parse it as follows:

| Input Format | Example | Parsed As |
|-------------|---------|-----------|
| Method + full URL | `GET https://api.example.com/v1/1/orders` | method=GET, full URL |
| Method + path | `GET /v1/1/orders` | method=GET, path (prepend baseUrl) |
| Path only | `/v1/1/orders` | method=GET (default), path |
| Chinese + path | `测试订单保存接口 POST /v1/1/orders` | method=POST, path |
| With body hint | `POST /v1/1/orders {"name":"test"}` | method=POST, path, body |

If the user provides a request body (JSON), extract it from the argument.

If the input is ambiguous, ask the user to clarify:
- HTTP method (default: GET)
- Full URL or path
- Request body (for POST/PUT)
- Query parameters
- Request headers

## Step 2: Read Auth Config

Read the configuration file at `.claude/h0-auth.yaml` in the project root.

### Config File Format

```yaml
# H0 平台认证配置
base_url: https://api.example.com
service_prefix: /hzero-demo-12345/v1
username: admin
password: admin123
client: client
client_secret: secret
```

### Config Field Reference

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `base_url` | Yes | — | API 网关地址（如 `https://hz.example.com`） |
| `service_prefix` | Yes | — | 测试接口路径前缀（如 `/hzero-demo-12345/v1`），调用接口时自动拼接到 `base_url` 之后 |
| `username` | Yes | — | 登录用户名 |
| `password` | Yes | — | 登录密码 |
| `client` | No | `client` | OAuth2 客户端 ID |
| `client_secret` | No | `secret` | OAuth2 客户端密钥 |

If the file does not exist, prompt the user to create it:

```bash
mkdir -p .claude
cat > .claude/h0-auth.yaml << 'EOF'
# H0 平台认证配置
base_url: https://your-api-gateway.example.com
service_prefix: /your-service-name/v1
username: your_username
password: your_password
client: client
client_secret: secret
EOF
```

**Important**: Warn the user that `.claude/h0-auth.yaml` contains sensitive credentials. Ensure `.claude/` is in `.gitignore`.

### Parsing the YAML

Read the file and parse the key-value pairs. The YAML format is simple (flat key: value), so extract values using line-based parsing:

```bash
# Read a value from h0-auth.yaml by key
get_config() {
  local key="$1"
  local file=".claude/h0-auth.yaml"
  grep -E "^${key}:" "$file" | sed "s/^${key}:[[:space:]]*//" | tr -d '"' | tr -d "'"
}
```

## Step 3: Obtain OAuth2 Token

Use `curl` to request a token via password grant, matching the Postman script's behavior.

The Postman script sends a POST to `/oauth/oauth/token` with form-data containing `client_id`, `client_secret`, `grant_type=password`, `username`, and `password`. Replicate this exactly:

```bash
# Read config values
BASE_URL=$(get_config "base_url")
USERNAME=$(get_config "username")
PASSWORD=$(get_config "password")
CLIENT=$(get_config "client")
CLIENT_SECRET=$(get_config "client_secret")

# Apply defaults matching Postman script behavior
CLIENT="${CLIENT:-client}"
CLIENT_SECRET="${CLIENT_SECRET:-secret}"

# Request token — exact match of the Postman form-data structure
TOKEN_RESPONSE=$(curl -s -X POST \
  "${BASE_URL}/oauth/oauth/token" \
  -F "client_id=${CLIENT}" \
  -F "client_secret=${CLIENT_SECRET}" \
  -F "grant_type=password" \
  -F "username=${USERNAME}" \
  -F "password=${PASSWORD}")

# Extract access_token (Postman uses jsonData.access_token)
ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"access_token":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
  echo "Token request failed. Response:"
  echo "$TOKEN_RESPONSE"
  echo ""
  echo "常见原因："
  echo "  1. 用户名或密码错误"
  echo "  2. client 或 client_secret 不匹配"
  echo "  3. base_url 不可达或 SSL 证书问题（可尝试加 -k 跳过验证）"
  exit 1
fi

echo "Token obtained successfully: ${ACCESS_TOKEN:0:20}..."
```

### Mapping from Postman to Claude Code

| Postman | Claude Code (curl) |
|---------|-------------------|
| `pm.environment.get("baseUrl")` | `base_url` from `.claude/h0-auth.yaml` |
| `pm.environment.get("login_password")` | `password` from `.claude/h0-auth.yaml` |
| `pm.environment.get("login_username")` | `username` from `.claude/h0-auth.yaml` |
| `pm.environment.get("client")` (default: `"client"`) | `client` from config, defaults to `client` |
| `pm.environment.get("client_secret")` (default: `"secret"`) | `client_secret` from config, defaults to `secret` |
| `body: { mode: "formdata", formdata: [...] }` | `curl -F` flags |
| `pm.sendRequest(loginRequest, callback)` | `curl` command |
| `jsonData.access_token` | `grep` from JSON response |
| `pm.variables.set("token", ...)` | Stored in shell variable for next request |

## Step 4: Send API Request & Capture Structured Data

Send the request **once** and capture response headers, body, and performance metrics in a single curl call. Use `-D` to dump headers (including the status line) to a temp file, and `-w` to append a metrics footer to stdout.

### Build the request

```bash
SERVICE_PREFIX=$(get_config "service_prefix")
USERNAME=$(get_config "username")
FULL_URL="${BASE_URL}${SERVICE_PREFIX}${API_PATH}"

# Body flag per method (array — safe for JSON bodies with spaces)
case "$METHOD" in
  POST|PUT) BODY_FLAG=(-d "$REQUEST_BODY") ;;
  DELETE)   if [ -n "$REQUEST_BODY" ]; then BODY_FLAG=(-d "$REQUEST_BODY"); else BODY_FLAG=(); fi ;;
  *)        BODY_FLAG=() ;;
esac

# Self-signed cert support: set K_FLAG=(-k) ONLY for dev https with self-signed certs
K_FLAG=()
```

### Send and capture

```bash
HEADERS_FILE=$(mktemp)
BODY=$(curl -s -D "$HEADERS_FILE" \
  -w '\n@@METRICS@@|%{http_code}|%{time_total}|%{size_download}|%{size_upload}|%{content_type}|%{num_redirects}' \
  "${K_FLAG[@]}" \
  -X "$METHOD" "$FULL_URL" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  "${EXTRA_HEADERS[@]}" \
  "${BODY_FLAG[@]}")
CURL_EXIT=$?
```

### Parse the captured data

| Data | Source | How |
|---|---|---|
| Status line (code + text) | `$HEADERS_FILE` line 1 | e.g. `HTTP/1.1 201 Created` |
| Response headers | `$HEADERS_FILE` lines 2+ | `key: value` |
| Response body | `$BODY` before the `@@METRICS@@` line | strip the metrics line |
| Metrics | `$BODY` `@@METRICS@@` line | split by `\|`: http_code, time_total, size_download, size_upload, content_type, num_redirects |

```bash
STATUS_LINE=$(head -1 "$HEADERS_FILE")
STATUS_CODE=$(echo "$STATUS_LINE" | awk '{print $2}')
STATUS_TEXT=$(echo "$STATUS_LINE" | cut -d' ' -f3-)
METRICS_LINE=$(echo "$BODY" | grep '@@METRICS@@')
RESPONSE_BODY=$(echo "$BODY" | sed '/@@METRICS@@/d')
TIME_TOTAL=$(echo "$METRICS_LINE"  | cut -d'|' -f3)
SIZE_DOWNLOAD=$(echo "$METRICS_LINE" | cut -d'|' -f4)
SIZE_UPLOAD=$(echo "$METRICS_LINE"   | cut -d'|' -f5)
CONTENT_TYPE=$(echo "$METRICS_LINE"  | cut -d'|' -f6)
```

If `$CURL_EXIT` is non-zero, skip parsing and go to curl-failure handling (Edge Cases).

### H0-Specific Request Details

| Convention | Detail |
|-----------|--------|
| Content-Type | `application/json` for POST/PUT request bodies |
| Tenant ID | Most APIs require `{organizationId}` in the path — default to `1` if not specified |
| Pagination | Pass `page` and `size` as query params for list APIs |
| Sort | Pass `sort` query param, e.g. `sort=id,desc` |

### For POST/PUT Requests

If the user does not provide a request body, construct a minimal one based on the entity name inferred from the URL path:

```
URL: /v1/1/orders
→ Entity: Order
→ Suggest body: [{"orderNo":"TEST-001","customerCode":"TEST"}]
```

Ask the user to confirm or modify the suggested body before sending.

## Step 5: Report Results

Parse the captured data and present a structured, detailed Markdown report inline. Use the template in [references/result-template.md](references/result-template.md).

### Determine the verdict

| Status class | Verdict |
|---|---|
| 2xx | ✅ 成功 |
| 3xx | ↪️ 重定向 |
| 4xx | ⚠️ 客户端错误 |
| 5xx | ❌ 服务器错误 |

If the request was retried after a 401, prepend: `⚠️ 首次 401，已重新获取 token 并重试一次 — `

### Render the inline report

Fill the Inline Result Skeleton (references/result-template.md) with parsed values:
- **Header**: `### {verdict} · {METHOD} {PATH}`
- **Metrics table**: `{STATUS_CODE} {STATUS_TEXT}` / `{TIME_TOTAL} s` / `{SIZE_DOWNLOAD} B / {SIZE_UPLOAD} B`
- **Request echo**: Method, FULL_URL, masked Auth `Bearer ${ACCESS_TOKEN:0:12}***` + username, request headers, request body (pretty-printed if JSON)
- **Response headers (key)**: `Content-Type`, `Content-Length`, `Date`, plus any `X-` headers; cap at 8 lines
- **Response body**: if `CONTENT_TYPE` contains `json` and body parses → 2-space pretty-print in a json code fence; else raw in a fenced block
- **curl repro**: reconstructed curl with `<TOKEN>` placeholder — never the real token

### Status Code Interpretation (append on non-2xx)

For non-2xx responses, append this hint table after the curl repro:

| Code | Meaning | What to Check |
|------|---------|---------------|
| 200 | 成功 | 验证返回数据是否符合预期 |
| 201 | 已创建 | 资源创建成功 |
| 204 | 无内容 | 删除/更新成功 |
| 400 | 请求错误 | 检查请求体格式和字段名 |
| 401 | 未授权 | Token 过期，重新获取 |
| 403 | 禁止访问 | 用户缺少权限，检查角色分配 |
| 404 | 未找到 | 检查 URL 路径和资源 ID |
| 500 | 服务器错误 | 检查服务端日志，可能是后端 bug |

If status is 401 and this is the first attempt, obtain a new token and resend once (see Edge Cases).

### Save to file (optional)

Save when ANY of: response body > 200 lines, user asks to save, or status is non-2xx.

Path: `.claude/api-test-results/{YYYYMMDD-HHMMSS}-{METHOD}-{SANITIZED_PATH}.md`
- `{SANITIZED_PATH}`: replace `/` with `-`, drop query string, strip illegal filename chars (e.g. `/v1/1/orders` → `v1-1-orders`)

Saved file = the inline report PLUS the Save-File Layout extra sections (full raw headers, full body, request metadata) from references/result-template.md. The curl repro in the file uses `<TOKEN>` (redacted).

After saving, insert under the header line: `> 完整结果已保存：{path}`. Remind the user to add `.claude/api-test-results/` to `.gitignore`.

### Large response inline truncation

If the response body exceeds 200 lines: inline shows the first 50 lines, then `…（共 N 行，完整内容已保存：{path}）`. The full body lives only in the saved file.

---

## Edge Cases

### curl Network Failure

If `$CURL_EXIT` is non-zero (network/DNS/SSL/timeout), render Branch Example D:

`### ❌ 请求失败 · {METHOD} {PATH}`
- curl exit code + stderr
- 常见原因：主机不可达 / DNS 解析失败 / 超时（可加 `--max-time 30`）/ 自签证书（可加 `-k`，仅限开发环境）

Do not attempt to parse headers/body.

### Non-JSON 5xx HTML Error Page

If status is 5xx and `CONTENT_TYPE` contains `html`: verdict `❌ 服务器错误`, show the first 20 body lines in an http code fence, then `服务端返回 HTML 错误页，建议查后端日志`. Auto-save full detail (see Step 5 Save to file). Matches Branch Example C.

### Token Expiration (401)

If the API returns 401 after a successful token request, re-authenticate (Step 3) and resend the request **once**. On the retried result, prepend the retry note to the verdict: `⚠️ 首次 401，已重新获取 token 并重试一次 — `.

### Large Response Bodies

If the body exceeds 200 lines: inline first 50 lines + save full body to file (see Step 5). Matches Branch Example E.

### Empty Body (204)

Render the verdict and metrics normally; the response body section shows `（无内容）`.

### Self-Signed Certificates

If `base_url` is HTTPS with a self-signed certificate, set `K_FLAG=(-k)`. Warn the user this is dev-only.

---

## Security Notes

- **Never commit `.claude/h0-auth.yaml`** to version control — add `.claude/` to `.gitignore`
- Tokens are held in memory only, never written to disk
- If the user shares their screen, warn them credentials are visible in the config file
