# Auth Config Template

## File Location

`.claude/h0-auth.yaml` in the project root.

## Template

```yaml
# H0 平台认证配置
# 注意：此文件包含敏感信息，请勿提交到版本控制
# 确保 .gitignore 中包含 .claude/ 目录

# API 网关地址（必填）
# 示例：https://hz.example.com 或 http://localhost:8080
base_url: https://your-api-gateway.example.com

# 测试接口路径前缀（必填）
# 即服务的路由前缀，调用接口时会自动拼接到 base_url 之后
# 示例：/hzero-demo-12345/v1
service_prefix: /your-service-name/v1

# 登录用户名（必填）
username: your_username

# 登录密码（必填）
password: your_password

# OAuth2 客户端 ID（可选，默认值：client）
client: client

# OAuth2 客户端密钥（可选，默认值：secret）
client_secret: secret
```

## Setup Instructions

1. Create the config file:
   ```bash
   mkdir -p .claude
   ```
2. Copy the template above into `.claude/h0-auth.yaml`
3. Fill in your actual credentials
4. Ensure `.claude/` is in `.gitignore`:
   ```bash
   echo ".claude/" >> .gitignore
   ```

## Field Reference

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `base_url` | string | Yes | — | H0 API 网关地址 |
| `service_prefix` | string | Yes | — | 测试接口路径前缀，如 `/hzero-demo-12345/v1` |
| `username` | string | Yes | — | 登录用户名 |
| `password` | string | Yes | — | 登录密码 |
| `client` | string | No | `client` | OAuth2 客户端 ID |
| `client_secret` | string | No | `secret` | OAuth2 客户端密钥 |

## URL Construction

最终请求 URL = `base_url` + `service_prefix` + `api_path`

示例：
```
base_url:        https://hz.example.com
service_prefix:  /hzero-demo-12345/v1
api_path:        /1/orders
→ Full URL:      https://hz.example.com/hzero-demo-12345/v1/1/orders
```

## Corresponding Postman Variables

| YAML Field | Postman Variable | Postman Default |
|------------|-----------------|-----------------|
| `base_url` | `pm.environment.get("baseUrl")` | 从请求 URL 推断 |
| `service_prefix` | 无直接对应，Postman 中通常写在请求 URL 中 | — |
| `username` | `pm.environment.get("login_username")` | 无 |
| `password` | `pm.environment.get("login_password")` | 无 |
| `client` | `pm.environment.get("client")` | `"client"` |
| `client_secret` | `pm.environment.get("client_secret")` | `"secret"` |
