# HTML Report Template

This file contains the HTML template for the code flow analysis report. When generating the report, use this template as the base structure and fill in the placeholders.

## Usage

Copy the HTML template below into the output file. Replace all `{{PLACEHOLDER}}` values with the actual traced data. The template is fully self-contained — no external CSS or JS files needed.

## Color Legend

| DDD Layer | Color | Hex |
|-----------|-------|-----|
| Controller | Blue | `#4A90D9` |
| Service | Purple | `#7B68EE` |
| Repository | Green | `#2E8B57` |
| Mapper | Gold | `#DAA520` |
| Feign/External | Red | `#DC143C` |

---

## Template

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>代码流程分析 — {{ENTRY_POINT_NAME}}</title>
<style>
  :root {
    --color-controller: #4A90D9;
    --color-service: #7B68EE;
    --color-repository: #2E8B57;
    --color-mapper: #DAA520;
    --color-external: #DC143C;
    --bg: #fafafa;
    --card-bg: #ffffff;
    --text: #333;
    --text-muted: #888;
    --border: #e0e0e0;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.6;
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }

  h1 { font-size: 1.8em; margin-bottom: 8px; }
  h2 {
    font-size: 1.4em;
    margin-top: 40px;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 2px solid var(--border);
  }
  h3 { font-size: 1.15em; margin-bottom: 10px; }

  .meta {
    color: var(--text-muted);
    font-size: 0.9em;
    margin-bottom: 30px;
  }

  /* Flow Diagram */
  .flow-diagram {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 30px 20px;
    overflow-x: auto;
    margin-bottom: 30px;
  }

  .flow-node {
    display: inline-block;
    padding: 10px 18px;
    border-radius: 6px;
    color: #fff;
    font-weight: 500;
    font-size: 0.9em;
    text-align: center;
    min-width: 140px;
    position: relative;
    margin: 8px 4px;
  }

  .flow-node.controller { background: var(--color-controller); }
  .flow-node.service { background: var(--color-service); }
  .flow-node.repository { background: var(--color-repository); }
  .flow-node.mapper { background: var(--color-mapper); }
  .flow-node.external { background: var(--color-external); }

  .flow-arrow {
    display: inline-block;
    color: var(--text-muted);
    font-size: 1.2em;
    margin: 0 6px;
    vertical-align: middle;
  }

  .flow-row {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    margin: 6px 0;
  }

  .flow-label {
    font-size: 0.8em;
    color: var(--text-muted);
    margin-top: 2px;
  }

  .flow-branch {
    display: flex;
    gap: 30px;
    justify-content: center;
    margin: 10px 0;
  }

  .flow-branch-arm {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .branch-condition {
    background: #f0f0f0;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 4px 12px;
    font-size: 0.85em;
    margin-bottom: 6px;
  }

  /* Step Cards */
  .step-card {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-left: 4px solid var(--color-service);
    border-radius: 6px;
    padding: 20px;
    margin-bottom: 16px;
  }

  .step-card.controller { border-left-color: var(--color-controller); }
  .step-card.service { border-left-color: var(--color-service); }
  .step-card.repository { border-left-color: var(--color-repository); }
  .step-card.mapper { border-left-color: var(--color-mapper); }
  .step-card.external { border-left-color: var(--color-external); }

  .step-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }

  .step-number {
    background: var(--color-service);
    color: #fff;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.85em;
    flex-shrink: 0;
  }

  .step-title {
    font-weight: 600;
    font-size: 1.05em;
  }

  .step-layer {
    font-size: 0.75em;
    padding: 2px 8px;
    border-radius: 3px;
    color: #fff;
    font-weight: 500;
  }

  .step-layer.controller { background: var(--color-controller); }
  .step-layer.service { background: var(--color-service); }
  .step-layer.repository { background: var(--color-repository); }
  .step-layer.mapper { background: var(--color-mapper); }
  .step-layer.external { background: var(--color-external); }

  .step-description {
    margin-bottom: 12px;
    color: #555;
  }

  .step-file {
    font-family: monospace;
    font-size: 0.85em;
    color: var(--text-muted);
    margin-bottom: 10px;
  }

  /* Code Block */
  .code-block {
    position: relative;
    margin-bottom: 10px;
  }

  .code-toggle {
    background: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 4px 10px;
    font-size: 0.8em;
    cursor: pointer;
    margin-bottom: 4px;
  }

  .code-toggle:hover { background: #eee; }

  .code-content {
    display: none;
    background: #2d2d2d;
    color: #ccc;
    border-radius: 4px;
    padding: 14px;
    overflow-x: auto;
    font-family: "Fira Code", "Consolas", monospace;
    font-size: 0.85em;
    line-height: 1.5;
  }

  .code-content.show { display: block; }

  .code-content .keyword { color: #c792ea; }
  .code-content .string { color: #c3e88d; }
  .code-content .comment { color: #676767; font-style: italic; }
  .code-content .annotation { color: #ffcb6b; }
  .code-content .type { color: #82aaff; }

  /* Data Flow */
  .data-flow {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 16px;
  }

  .data-flow-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 8px 0;
    flex-wrap: wrap;
  }

  .data-box {
    background: #f8f8f8;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 8px 14px;
    font-family: monospace;
    font-size: 0.9em;
  }

  .data-arrow {
    color: var(--text-muted);
    font-size: 1.2em;
  }

  /* Decision Tree */
  .decision-tree {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 16px;
  }

  .decision-node {
    margin: 8px 0;
    padding-left: 24px;
    border-left: 2px solid #ddd;
  }

  .decision-condition {
    background: #fff3cd;
    border: 1px solid #ffc107;
    border-radius: 4px;
    padding: 6px 12px;
    font-family: monospace;
    font-size: 0.9em;
    margin-bottom: 6px;
    display: inline-block;
  }

  .decision-branch {
    padding: 4px 0 4px 20px;
    position: relative;
  }

  .decision-branch::before {
    content: attr(data-label);
    position: absolute;
    left: 0;
    font-weight: 600;
    font-size: 0.85em;
    color: var(--text-muted);
  }

  /* File Index Table */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    font-size: 0.9em;
  }

  th, td {
    text-align: left;
    padding: 10px 14px;
    border-bottom: 1px solid var(--border);
  }

  th {
    background: #f5f5f5;
    font-weight: 600;
  }

  tr:hover { background: #f9f9f9; }

  /* Overview */
  .overview {
    background: #eef6ff;
    border: 1px solid #b8d4f0;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 30px;
    line-height: 1.8;
  }

  /* Legend */
  .legend {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 20px;
    font-size: 0.85em;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .legend-dot {
    width: 12px;
    height: 12px;
    border-radius: 3px;
  }

  /* Collapsible sections */
  .collapsible-header {
    cursor: pointer;
    user-select: none;
    padding: 8px 0;
  }

  .collapsible-header::before {
    content: "▶ ";
    font-size: 0.7em;
    transition: transform 0.2s;
  }

  .collapsible-header.open::before {
    content: "▼ ";
  }

  @media (max-width: 768px) {
    body { padding: 10px; }
    .flow-row { flex-direction: column; align-items: stretch; }
    .flow-arrow { transform: rotate(90deg); }
    .step-card { padding: 14px; }
  }
</style>
</head>
<body>

<h1>代码流程分析报告</h1>
<p class="meta">
  项目：{{PROJECT_NAME}}<br>
  入口：{{ENTRY_POINT_NAME}}<br>
  生成时间：{{GENERATION_DATE}}
</p>

<!-- Legend -->
<div class="legend">
  <div class="legend-item">
    <div class="legend-dot" style="background: var(--color-controller)"></div> Controller
  </div>
  <div class="legend-item">
    <div class="legend-dot" style="background: var(--color-service)"></div> Service
  </div>
  <div class="legend-item">
    <div class="legend-dot" style="background: var(--color-repository)"></div> Repository
  </div>
  <div class="legend-item">
    <div class="legend-dot" style="background: var(--color-mapper)"></div> Mapper
  </div>
  <div class="legend-item">
    <div class="legend-dot" style="background: var(--color-external)"></div> External/Feign
  </div>
</div>

<!-- Overview -->
<h2>概览</h2>
<div class="overview">
  {{OVERVIEW_TEXT}}
</div>

<!-- Flow Diagram -->
<h2>调用流程图</h2>
<div class="flow-diagram">
  <!-- Example flow row — replicate for each step -->
  <div class="flow-row">
    <div class="flow-node controller">OrderController.save()</div>
    <span class="flow-arrow">→</span>
    <div class="flow-node service">OrderServiceImpl.saveData()</div>
    <span class="flow-arrow">→</span>
    <div class="flow-node repository">OrderRepositoryImpl</div>
    <span class="flow-arrow">→</span>
    <div class="flow-node mapper">OrderMapper</div>
  </div>

  <!-- Example branch -->
  <div class="flow-branch">
    <div class="flow-branch-arm">
      <div class="branch-condition">id == null</div>
      <div class="flow-node repository">batchInsertSelective()</div>
    </div>
    <div class="flow-branch-arm">
      <div class="branch-condition">id != null</div>
      <div class="flow-node repository">batchUpdateByPrimaryKeySelective()</div>
    </div>
  </div>
</div>

<!-- Step-by-Step Walkthrough -->
<h2>逐步执行流程</h2>

<!-- Step 1 example -->
<div class="step-card controller">
  <div class="step-header">
    <div class="step-number">1</div>
    <div class="step-title">OrderController.save()</div>
    <span class="step-layer controller">Controller</span>
  </div>
  <div class="step-description">
    接收前端 POST 请求，包含订单列表。执行参数校验、Token 验证、租户设置后，委托给 Service 层处理。
  </div>
  <div class="step-file">📄 src/main/java/.../api/controller/v1/OrderController.java:134-145</div>
  <div class="code-block">
    <button class="code-toggle" onclick="toggleCode(this)">展开代码</button>
    <pre class="code-content"><span class="annotation">@PostMapping</span>
<span class="keyword">public</span> ResponseEntity&lt;List&lt;Order&gt;&gt; <span class="type">save</span>(...) {
    validObject(orders);
    SecurityTokenHelper.validTokenIgnoreInsert(orders);
    orders.forEach(item -> item.setTenantId(organizationId));
    orderService.saveData(orders);
    <span class="keyword">return</span> Results.success(orders);
}</pre>
  </div>
</div>

<!-- Repeat step cards for each node in the chain -->

<!-- Branching Logic -->
<h2>分支逻辑</h2>
<div class="decision-tree">
  <!-- Example decision node -->
  <div class="decision-node">
    <div class="decision-condition">order.getId() == null</div>
    <div class="decision-branch" data-label="TRUE → ">
      新增流程：收集到 insertList，调用 batchInsertSelective
    </div>
    <div class="decision-branch" data-label="FALSE → ">
      更新流程：收集到 updateList，调用 batchUpdateByPrimaryKeySelective
    </div>
  </div>
</div>

<!-- Data Flow -->
<h2>数据流转</h2>
<div class="data-flow">
  <div class="data-flow-row">
    <div class="data-box">List&lt;Order&gt; (请求体)</div>
    <span class="data-arrow">→</span>
    <div class="data-box">validObject 校验</div>
    <span class="data-arrow">→</span>
    <div class="data-box">setTenantId 注入租户</div>
    <span class="data-arrow">→</span>
    <div class="data-box">split insert/update</div>
    <span class="data-arrow">→</span>
    <div class="data-box">bpm_order 表</div>
  </div>
</div>

<!-- Error Paths -->
<h2>异常处理</h2>
<div class="step-card" style="border-left-color: #e74c3c;">
  <div class="step-header">
    <div class="step-number" style="background: #e74c3c;">!</div>
    <div class="step-title">CommonException</div>
  </div>
  <div class="step-description">
    Service 层遇到业务异常时抛出 CommonException，由全局异常处理器捕获并返回错误响应。Controller 不做 try-catch。
  </div>
</div>

<!-- External Dependencies -->
<h2>外部依赖</h2>
<table>
  <thead>
    <tr><th>服务</th><th>调用方式</th><th>用途</th></tr>
  </thead>
  <tbody>
    <tr>
      <td>{{EXTERNAL_SERVICE_NAME}}</td>
      <td>Feign / RestTemplate</td>
      <td>{{PURPOSE}}</td>
    </tr>
  </tbody>
</table>

<!-- File Index -->
<h2>涉及文件索引</h2>
<table>
  <thead>
    <tr><th>文件</th><th>DDD 层级</th><th>角色</th></tr>
  </thead>
  <tbody>
    <tr>
      <td><code>OrderController.java</code></td>
      <td><span class="step-layer controller">Controller</span></td>
      <td>REST 入口，参数接收与校验</td>
    </tr>
    <!-- Repeat for each file -->
  </tbody>
</table>

<script>
function toggleCode(btn) {
  var content = btn.nextElementSibling;
  content.classList.toggle('show');
  btn.textContent = content.classList.contains('show') ? '收起代码' : '展开代码';
}

// Auto-expand first code block
document.addEventListener('DOMContentLoaded', function() {
  var first = document.querySelector('.code-content');
  if (first) {
    first.classList.add('show');
    first.previousElementSibling.textContent = '收起代码';
  }
});
</script>

</body>
</html>
```

## Template Variables

| Placeholder | Description | Example |
|-------------|-------------|---------|
| `{{ENTRY_POINT_NAME}}` | The traced entry point | `OrderController.save()` |
| `{{PROJECT_NAME}}` | Project artifact name | `hzero-order-service` |
| `{{GENERATION_DATE}}` | Report generation time | `2026-05-13 14:30` |
| `{{OVERVIEW_TEXT}}` | One-paragraph flow summary | `该流程处理订单的创建与更新...` |
| `{{EXTERNAL_SERVICE_NAME}}` | External service name | `IamRemoteService` |
| `{{PURPOSE}}` | Why the external call is made | `获取用户权限信息` |

## Extending the Template

When the traced flow has more than one entry point (e.g., full module analysis), duplicate the sections from "调用流程图" onward for each flow, wrapping them in a container with a navigation bar:

```html
<nav class="flow-nav">
  <a href="#flow-list" class="active">列表查询</a>
  <a href="#flow-save">创建/更新</a>
  <a href="#flow-delete">删除</a>
</nav>
```

Add corresponding CSS for `.flow-nav` (horizontal tabs) and `.flow-nav a.active` styling.
