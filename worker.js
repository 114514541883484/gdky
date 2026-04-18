// Cloudflare Worker - 卡密验证系统 API
// 部署地址: https://gdky.1582673484.workers.dev

// 卡密数据存储 (使用 Cloudflare KV 或内存存储)
// 实际部署时建议使用 KV 存储: const KEYS_KV = GDKY_KEYS;

// 默认卡密数据 (演示用，实际应使用 KV 存储)
let keysData = {
  keys: [],
  scripts: {
    "default": {
      name: "Roblox 示例脚本",
      content: "-- Roblox 示例脚本\n-- 欢迎使用卡密系统\n\nlocal player = game.Players.LocalPlayer\nlocal character = player.Character or player.CharacterAdded:Wait()\n\n-- 示例功能：打印玩家信息\nprint('玩家名称: ' .. player.Name)\nprint('用户ID: ' .. player.UserId)\n\n-- 示例功能：发送通知\ngame.StarterGui:SetCore('SendNotification', {\n    Title = '卡密系统',\n    Text = '脚本加载成功！',\n    Duration = 5\n})",
      description: "Roblox Lua 示例脚本"
    }
  },
  settings: {
    adminPassword: "admin123",
    allowReuse: false
  }
};

// CORS 响应头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

// 生成响应
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: corsHeaders
  });
}

// 验证卡密
async function verifyKey(key, hwid = null) {
  const upperKey = key.toUpperCase().trim();
  
  const keyObj = keysData.keys.find(k => k.key.toUpperCase() === upperKey);
  
  if (!keyObj) {
    return { success: false, message: "卡密无效" };
  }
  
  if (keyObj.used && !keysData.settings.allowReuse) {
    // 检查是否是同一设备
    if (keyObj.hwid && hwid && keyObj.hwid === hwid) {
      return { 
        success: true, 
        message: "验证成功",
        script: keysData.scripts[keyObj.scriptId || 'default'] || keysData.scripts['default'],
        key: keyObj
      };
    }
    return { success: false, message: "该卡密已被使用" };
  }
  
  // 标记为已使用
  keyObj.used = true;
  keyObj.usedAt = new Date().toISOString();
  keyObj.hwid = hwid;
  
  // 这里应该保存到 KV 存储
  // await KEYS_KV.put('keysData', JSON.stringify(keysData));
  
  return { 
    success: true, 
    message: "验证成功",
    script: keysData.scripts[keyObj.scriptId || 'default'] || keysData.scripts['default'],
    key: keyObj
  };
}

// 生成随机卡密
function generateRandomKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let key = '';
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) key += '-';
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

// 处理请求
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    // API 路由
    
    // 1. 验证卡密 (Roblox 客户端调用)
    if (path === '/api/verify' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { key, hwid } = body;
        
        if (!key) {
          return jsonResponse({ success: false, message: "请输入卡密" }, 400);
        }
        
        const result = await verifyKey(key, hwid);
        return jsonResponse(result);
      } catch (e) {
        return jsonResponse({ success: false, message: "请求格式错误" }, 400);
      }
    }
    
    // 2. 获取脚本内容 (Roblox 客户端调用)
    if (path === '/api/get-script' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { key, hwid } = body;
        
        if (!key) {
          return jsonResponse({ success: false, message: "请输入卡密" }, 400);
        }
        
        const result = await verifyKey(key, hwid);
        if (result.success) {
          return jsonResponse({
            success: true,
            script: result.script
          });
        } else {
          return jsonResponse(result, 403);
        }
      } catch (e) {
        return jsonResponse({ success: false, message: "请求格式错误" }, 400);
      }
    }
    
    // 3. 管理员登录
    if (path === '/api/admin/login' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { password } = body;
        
        if (password === keysData.settings.adminPassword) {
          return jsonResponse({ 
            success: true, 
            token: "admin_token_" + Date.now() // 实际应使用 JWT
          });
        } else {
          return jsonResponse({ success: false, message: "密码错误" }, 401);
        }
      } catch (e) {
        return jsonResponse({ success: false, message: "请求格式错误" }, 400);
      }
    }
    
    // 4. 获取所有卡密 (管理员)
    if (path === '/api/admin/keys' && request.method === 'GET') {
      // 实际应验证 token
      return jsonResponse({
        success: true,
        keys: keysData.keys,
        scripts: keysData.scripts,
        settings: keysData.settings
      });
    }
    
    // 5. 生成卡密 (管理员)
    if (path === '/api/admin/generate' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { count = 1, scriptId = 'default' } = body;
        
        const newKeys = [];
        for (let i = 0; i < count; i++) {
          const key = generateRandomKey();
          keysData.keys.push({
            key: key,
            used: false,
            createdAt: new Date().toISOString(),
            usedAt: null,
            hwid: null,
            scriptId: scriptId
          });
          newKeys.push(key);
        }
        
        // 保存到 KV
        // await KEYS_KV.put('keysData', JSON.stringify(keysData));
        
        return jsonResponse({
          success: true,
          keys: newKeys
        });
      } catch (e) {
        return jsonResponse({ success: false, message: "生成失败" }, 500);
      }
    }
    
    // 6. 删除卡密 (管理员)
    if (path === '/api/admin/delete-key' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { key } = body;
        
        const index = keysData.keys.findIndex(k => k.key === key);
        if (index > -1) {
          keysData.keys.splice(index, 1);
          // await KEYS_KV.put('keysData', JSON.stringify(keysData));
          return jsonResponse({ success: true, message: "删除成功" });
        } else {
          return jsonResponse({ success: false, message: "卡密不存在" }, 404);
        }
      } catch (e) {
        return jsonResponse({ success: false, message: "删除失败" }, 500);
      }
    }
    
    // 7. 添加脚本 (管理员)
    if (path === '/api/admin/add-script' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { id, name, content, description } = body;
        
        if (!id || !name || !content) {
          return jsonResponse({ success: false, message: "参数不完整" }, 400);
        }
        
        keysData.scripts[id] = {
          name,
          content,
          description: description || ''
        };
        
        // await KEYS_KV.put('keysData', JSON.stringify(keysData));
        
        return jsonResponse({ success: true, message: "添加成功" });
      } catch (e) {
        return jsonResponse({ success: false, message: "添加失败" }, 500);
      }
    }
    
    // 8. 更新设置 (管理员)
    if (path === '/api/admin/settings' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { allowReuse, adminPassword } = body;
        
        if (allowReuse !== undefined) {
          keysData.settings.allowReuse = allowReuse;
        }
        if (adminPassword) {
          keysData.settings.adminPassword = adminPassword;
        }
        
        // await KEYS_KV.put('keysData', JSON.stringify(keysData));
        
        return jsonResponse({ success: true, message: "设置已更新" });
      } catch (e) {
        return jsonResponse({ success: false, message: "更新失败" }, 500);
      }
    }
    
    // 9. 健康检查
    if (path === '/health') {
      return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() });
    }
    
    // 默认返回 404
    return jsonResponse({ success: false, message: "API 不存在" }, 404);
  }
};

// ============================================
// 部署说明:
// 1. 在 Cloudflare Workers 控制台创建新 Worker
// 2. 将以上代码粘贴到 Worker 编辑器
// 3. (可选) 创建 KV 命名空间并绑定
// 4. 部署并记录 Worker URL
// 5. 更新 Roblox 脚本中的 API URL
// ============================================
