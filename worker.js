// Cloudflare Worker - Roblox 代码托管服务
// 支持上传代码文件并通过 Raw URL 访问

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS 头设置 - 允许 Roblox 客户端访问
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // 处理预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // 路由处理
    try {
      // 主页 - 上传界面
      if (path === '/' || path === '/index.html') {
        return new Response(getUploadPage(), {
          headers: { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders },
        });
      }

      // API: 上传文件
      if (path === '/api/upload' && request.method === 'POST') {
        return handleUpload(request, env);
      }

      // API: 获取文件列表
      if (path === '/api/files' && request.method === 'GET') {
        return handleListFiles(request, env);
      }

      // API: 删除文件
      if (path.startsWith('/api/delete/') && request.method === 'DELETE') {
        const fileId = path.replace('/api/delete/', '');
        return handleDelete(fileId, env);
      }

      // Raw 访问: /raw/{fileId}
      if (path.startsWith('/raw/')) {
        const fileId = path.replace('/raw/', '');
        return handleRaw(fileId, env);
      }

      // 404
      return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  },
};

// 处理文件上传
async function handleUpload(request, env) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const customId = formData.get('id');

    if (!file) {
      return jsonResponse({ error: 'No file provided' }, 400);
    }

    const content = await file.text();
    const fileId = customId || generateId();
    const fileName = file.name;

    // 保存到 KV 存储
    await env.CODE_STORAGE.put(fileId, JSON.stringify({
      name: fileName,
      content: content,
      uploadedAt: new Date().toISOString(),
    }));

    const baseUrl = new URL(request.url).origin;

    return jsonResponse({
      success: true,
      id: fileId,
      name: fileName,
      rawUrl: `${baseUrl}/raw/${fileId}`,
      message: 'File uploaded successfully',
    });
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}

// 处理 Raw 访问
async function handleRaw(fileId, env) {
  try {
    const data = await env.CODE_STORAGE.get(fileId);

    if (!data) {
      return new Response('-- File not found', { status: 404 });
    }

    const file = JSON.parse(data);

    return new Response(file.content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    return new Response(`-- Error: ${error.message}`, { status: 500 });
  }
}

// 获取文件列表
async function handleListFiles(request, env) {
  try {
    const list = await env.CODE_STORAGE.list();
    const files = [];

    for (const key of list.keys) {
      const data = await env.CODE_STORAGE.get(key.name);
      if (data) {
        const file = JSON.parse(data);
        files.push({
          id: key.name,
          name: file.name,
          uploadedAt: file.uploadedAt,
        });
      }
    }

    return jsonResponse({ files });
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}

// 删除文件
async function handleDelete(fileId, env) {
  try {
    await env.CODE_STORAGE.delete(fileId);
    return jsonResponse({ success: true, message: 'File deleted' });
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}

// JSON 响应辅助函数
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

// 生成唯一 ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// 上传页面 HTML
function getUploadPage() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Roblox 代码托管</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            min-height: 100vh;
            color: #e0e0e0;
            padding: 20px;
        }
        .container { max-width: 1000px; margin: 0 auto; }
        header { text-align: center; padding: 40px 0; }
        header h1 {
            font-size: 2.5rem;
            background: linear-gradient(90deg, #00d4ff, #7b2cbf);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
        }
        header p { color: #888; }
        .upload-box {
            background: rgba(255,255,255,0.05);
            border: 2px dashed #00d4ff;
            border-radius: 16px;
            padding: 60px 40px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s;
            margin-bottom: 30px;
        }
        .upload-box:hover {
            background: rgba(0,212,255,0.1);
            transform: translateY(-2px);
        }
        .upload-box.dragover {
            background: rgba(0,212,255,0.2);
            border-color: #7b2cbf;
        }
        .upload-icon { font-size: 4rem; margin-bottom: 20px; }
        .upload-text { font-size: 1.3rem; color: #00d4ff; margin-bottom: 10px; }
        .upload-hint { color: #666; }
        #fileInput { display: none; }
        .file-list { margin-top: 30px; }
        .file-item {
            background: rgba(255,255,255,0.05);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 15px;
            border: 1px solid rgba(255,255,255,0.1);
        }
        .file-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 10px;
        }
        .file-name { font-weight: 600; font-size: 1.1rem; }
        .file-actions { display: flex; gap: 10px; flex-wrap: wrap; }
        .btn {
            padding: 8px 16px;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            font-size: 0.9rem;
            transition: all 0.3s;
        }
        .btn-raw {
            background: linear-gradient(135deg, #00d4ff, #0099cc);
            color: #fff;
        }
        .btn-copy {
            background: rgba(255,255,255,0.1);
            color: #e0e0e0;
            border: 1px solid rgba(255,255,255,0.2);
        }
        .btn-delete {
            background: rgba(255,71,87,0.2);
            color: #ff4757;
            border: 1px solid rgba(255,71,87,0.3);
        }
        .btn:hover { transform: translateY(-2px); }
        .url-box {
            background: #0d1117;
            padding: 10px 15px;
            border-radius: 8px;
            margin-top: 15px;
            font-family: monospace;
            font-size: 0.85rem;
            word-break: break-all;
            color: #00d4ff;
        }
        .url-box label {
            color: #666;
            font-size: 0.75rem;
            display: block;
            margin-bottom: 5px;
        }
        .empty-state {
            text-align: center;
            padding: 60px;
            color: #666;
        }
        .toast {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: linear-gradient(135deg, #00d4ff, #7b2cbf);
            color: #fff;
            padding: 15px 25px;
            border-radius: 12px;
            transform: translateY(100px);
            opacity: 0;
            transition: all 0.3s;
            z-index: 1000;
        }
        .toast.show { transform: translateY(0); opacity: 1; }
        .custom-id-input {
            margin-top: 20px;
            padding: 10px 15px;
            border-radius: 8px;
            border: 1px solid rgba(0,212,255,0.3);
            background: rgba(0,0,0,0.3);
            color: #fff;
            width: 300px;
            max-width: 100%;
        }
        .custom-id-input::placeholder { color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>📦 Roblox 代码托管</h1>
            <p>上传 Lua 脚本，获取可直接在 Roblox 执行的 Raw URL</p>
        </header>

        <div class="upload-box" id="uploadBox">
            <div class="upload-icon">📁</div>
            <div class="upload-text">点击或拖拽上传 Lua 文件</div>
            <div class="upload-hint">支持 .lua, .txt 文件</div>
            <input type="text" class="custom-id-input" id="customId" placeholder="自定义ID (可选，如: myscript)">
        </div>
        <input type="file" id="fileInput" accept=".lua,.txt">

        <div class="file-list" id="fileList">
            <div class="empty-state">
                <div style="font-size: 3rem; margin-bottom: 15px;">📭</div>
                <p>还没有上传任何文件</p>
            </div>
        </div>
    </div>

    <div class="toast" id="toast"></div>

    <script>
        const uploadBox = document.getElementById('uploadBox');
        const fileInput = document.getElementById('fileInput');
        const fileList = document.getElementById('fileList');
        const customIdInput = document.getElementById('customId');
        const toast = document.getElementById('toast');

        uploadBox.addEventListener('click', (e) => {
            if (e.target !== customIdInput) fileInput.click();
        });

        fileInput.addEventListener('change', handleFiles);

        uploadBox.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadBox.classList.add('dragover');
        });

        uploadBox.addEventListener('dragleave', () => {
            uploadBox.classList.remove('dragover');
        });

        uploadBox.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadBox.classList.remove('dragover');
            handleFiles({ target: { files: e.dataTransfer.files } });
        });

        async function handleFiles(e) {
            const file = e.target.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('file', file);

            const customId = customIdInput.value.trim();
            if (customId) formData.append('id', customId);

            showToast('⏳ 上传中...');

            try {
                const res = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });
                const data = await res.json();

                if (data.success) {
                    showToast('✅ 上传成功！');
                    customIdInput.value = '';
                    loadFiles();
                } else {
                    showToast('❌ ' + data.error);
                }
            } catch (err) {
                showToast('❌ 上传失败');
            }
        }

        async function loadFiles() {
            try {
                const res = await fetch('/api/files');
                const data = await res.json();
                renderFiles(data.files);
            } catch (err) {
                console.error(err);
            }
        }

        function renderFiles(files) {
            if (!files || files.length === 0) {
                fileList.innerHTML = \`
                    <div class="empty-state">
                        <div style="font-size: 3rem; margin-bottom: 15px;">📭</div>
                        <p>还没有上传任何文件</p>
                    </div>
                \`;
                return;
            }

            fileList.innerHTML = files.map(f => \`
                <div class="file-item">
                    <div class="file-header">
                        <div class="file-name">📄 \${f.name}</div>
                        <div class="file-actions">
                            <button class="btn btn-copy" onclick="copyUrl('\${location.origin}/raw/\${f.id}')">📋 复制URL</button>
                            <button class="btn btn-raw" onclick="viewRaw('\${f.id}')">👁️ 查看</button>
                            <button class="btn btn-delete" onclick="deleteFile('\${f.id}')">🗑️ 删除</button>
                        </div>
                    </div>
                    <div class="url-box">
                        <label>Roblox 执行代码:</label>
                        loadstring(game:HttpGet("\${location.origin}/raw/\${f.id}"))()
                    </div>
                </div>
            \`).join('');
        }

        function copyUrl(url) {
            navigator.clipboard.writeText(url).then(() => {
                showToast('✅ URL 已复制！');
            });
        }

        function viewRaw(id) {
            window.open('/raw/' + id, '_blank');
        }

        async function deleteFile(id) {
            if (!confirm('确定删除？')) return;
            try {
                await fetch('/api/delete/' + id, { method: 'DELETE' });
                showToast('🗑️ 已删除');
                loadFiles();
            } catch (err) {
                showToast('❌ 删除失败');
            }
        }

        function showToast(msg) {
            toast.textContent = msg;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 3000);
        }

        loadFiles();
    </script>
</body>
</html>`;
}
