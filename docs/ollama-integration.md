# Ollama 本地大语言模型使用指南

## 安装与常用命令

### Windows 安装

1. 从 [Ollama官网](https://ollama.ai/download) 下载安装包
2. 安装完成后，Ollama 会在后台运行，访问地址: `localhost:11434`

### 常用命令

```bash
# 下载模型
ollama pull llama3:1b     # 轻量模型 (~1GB)
ollama pull qwen:7b       # 中文支持较好

# 服务管理
ollama serve              # 启动服务
ollama ps                 # 查看运行中的模型
ollama kill               # 停止服务
```

## API 速查

### 1. 聊天接口

```http
POST http://localhost:11434/api/chat
```

请求示例:

```json
{
  "model": "llama3:7b",
  "messages": [
    {
      "role": "user",
      "content": "请简要介绍智能楼宇系统"
    }
  ],
  "stream": false
}
```

### 2. 检查服务状态

```http
GET http://localhost:11434/api/version
```

### 3. 获取模型列表

```http
GET http://localhost:11434/api/tags
```

## 前端集成示例

```typescript
// API 调用示例
const response = await fetch("http://localhost:11434/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "qwen:7b",
    messages: [{ role: "user", content: userQuestion }],
    stream: false,
  }),
});

const result = await response.json();
const aiResponse = result.message.content;
```

## 常见问题排查

- **服务无法启动**: 检查端口占用 `netstat -ano | findstr 11434`
- **模型响应慢**: 使用更小模型 (llama3:1b) 或检查 GPU 配置
- **API 请求失败**: 确认 Ollama 正在运行 `ollama ps`
