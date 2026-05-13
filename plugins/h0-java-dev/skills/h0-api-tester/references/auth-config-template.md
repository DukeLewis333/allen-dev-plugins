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
| `username` | string | Yes | — | 登录用户名 |
| `password` | string | Yes | — | 登录密码 |
| `client` | string | No | `client` | OAuth2 客户端 ID |
| `client_secret` | string | No | `secret` | OAuth2 客户端密钥 |

## Corresponding Postman Variables

| YAML Field | Postman Variable | Postman Default |
|------------|-----------------|-----------------|
| `base_url` | `pm.environment.get("baseUrl")` | 从请求 URL 推断 |
| `username` | `pm.environment.get("login_username")` | 无 |
| `password` | `pm.environment.get("login_password")` | 无 |
| `client` | `pm.environment.get("client")` | `"client"` |
| `client_secret` | `pm.environment.get("client_secret")` | `"secret"` |
