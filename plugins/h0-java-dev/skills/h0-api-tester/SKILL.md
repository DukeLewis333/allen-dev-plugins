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
username: admin
password: admin123
client: client
client_secret: secret
```

### Config Field Reference

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `base_url` | Yes | — | API 网关地址（如 `https://hz.example.com`） |
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

## Step 4: Send API Request

With the token, construct and send the actual API request. The token goes into the `Authorization: Bearer` header (matching how Postman uses it).

```bash
# Construct full URL
FULL_URL="${BASE_URL}${API_PATH}"

# Send request based on method
case "$METHOD" in
  GET)
    RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}\nTIME:%{time_total}" \
      -X GET "$FULL_URL" \
      -H "Authorization: Bearer ${ACCESS_TOKEN}" \
      -H "Content-Type: application/json" \
      ${EXTRA_HEADERS})
    ;;
  POST|PUT)
    RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}\nTIME:%{time_total}" \
      -X "$METHOD" "$FULL_URL" \
      -H "Authorization: Bearer ${ACCESS_TOKEN}" \
      -H "Content-Type: application/json" \
      ${EXTRA_HEADERS} \
      -d "$REQUEST_BODY")
    ;;
  DELETE)
    RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}\nTIME:%{time_total}" \
      -X DELETE "$FULL_URL" \
      -H "Authorization: Bearer ${ACCESS_TOKEN}" \
      -H "Content-Type: application/json" \
      ${EXTRA_HEADERS} \
      ${REQUEST_BODY:+-d "$REQUEST_BODY"})
    ;;
esac
```

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

Parse the response and present it clearly.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
请求：POST /v1/1/orders
状态码：201 Created
耗时：0.235s
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Response Body:
{
  "id": 10086,
  "orderNo": "TEST-001",
  "tenantId": 1,
  ...
}
```

### Status Code Interpretation

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

If the response is 401, automatically retry by obtaining a new token and resending the request once.

---

## Edge Cases

### Token Expiration

If the API returns 401 after a successful token request, re-authenticate and retry once.

### Large Response Bodies

If the response body exceeds 200 lines, show the first 50 lines and offer to save the full response to a file.

### Self-Signed Certificates

If the base_url uses HTTPS with a self-signed certificate, add `-k` to curl. Warn the user this should only be used in dev environments.

---

## Security Notes

- **Never commit `.claude/h0-auth.yaml`** to version control — add `.claude/` to `.gitignore`
- Tokens are held in memory only, never written to disk
- If the user shares their screen, warn them credentials are visible in the config file
