-- Roblox 卡密验证系统
-- 由服务器端验证卡密

local KeySystem = {}

-- 配置
local CONFIG = {
    API_URL = "https://gdky.1582673484.workers.dev", -- Cloudflare Worker API 地址
    TITLE = "卡密验证系统",
    DESCRIPTION = "请输入您的卡密以继续使用"
}

-- 创建 UI
function KeySystem:CreateUI()
    local player = game.Players.LocalPlayer
    local playerGui = player:WaitForChild("PlayerGui")
    
    -- 移除旧的 UI
    local oldGui = playerGui:FindFirstChild("KeySystemUI")
    if oldGui then oldGui:Destroy() end
    
    -- 创建 ScreenGui
    local screenGui = Instance.new("ScreenGui")
    screenGui.Name = "KeySystemUI"
    screenGui.ResetOnSpawn = false
    screenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
    screenGui.Parent = playerGui
    
    -- 主框架
    local mainFrame = Instance.new("Frame")
    mainFrame.Name = "MainFrame"
    mainFrame.Size = UDim2.new(0, 400, 0, 300)
    mainFrame.Position = UDim2.new(0.5, -200, 0.5, -150)
    mainFrame.BackgroundColor3 = Color3.fromRGB(25, 25, 35)
    mainFrame.BorderSizePixel = 0
    mainFrame.Parent = screenGui
    
    -- 圆角
    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 12)
    corner.Parent = mainFrame
    
    -- 阴影
    local shadow = Instance.new("ImageLabel")
    shadow.Name = "Shadow"
    shadow.AnchorPoint = Vector2.new(0.5, 0.5)
    shadow.BackgroundTransparency = 1
    shadow.Position = UDim2.new(0.5, 0, 0.5, 0)
    shadow.Size = UDim2.new(1, 40, 1, 40)
    shadow.ZIndex = -1
    shadow.Image = "rbxassetid://6015897843"
    shadow.ImageColor3 = Color3.fromRGB(0, 0, 0)
    shadow.ImageTransparency = 0.5
    shadow.Parent = mainFrame
    
    -- 标题
    local title = Instance.new("TextLabel")
    title.Name = "Title"
    title.Size = UDim2.new(1, 0, 0, 50)
    title.BackgroundTransparency = 1
    title.Text = CONFIG.TITLE
    title.TextColor3 = Color3.fromRGB(233, 69, 96)
    title.TextSize = 24
    title.Font = Enum.Font.GothamBold
    title.Parent = mainFrame
    
    -- 描述
    local desc = Instance.new("TextLabel")
    desc.Name = "Description"
    desc.Size = UDim2.new(1, -40, 0, 30)
    desc.Position = UDim2.new(0, 20, 0, 55)
    desc.BackgroundTransparency = 1
    desc.Text = CONFIG.DESCRIPTION
    desc.TextColor3 = Color3.fromRGB(150, 150, 150)
    desc.TextSize = 14
    desc.Font = Enum.Font.Gotham
    desc.TextWrapped = true
    desc.Parent = mainFrame
    
    -- 输入框背景
    local inputBg = Instance.new("Frame")
    inputBg.Name = "InputBg"
    inputBg.Size = UDim2.new(1, -40, 0, 50)
    inputBg.Position = UDim2.new(0, 20, 0, 100)
    inputBg.BackgroundColor3 = Color3.fromRGB(35, 35, 45)
    inputBg.BorderSizePixel = 0
    inputBg.Parent = mainFrame
    
    local inputCorner = Instance.new("UICorner")
    inputCorner.CornerRadius = UDim.new(0, 8)
    inputCorner.Parent = inputBg
    
    -- 输入框
    local input = Instance.new("TextBox")
    input.Name = "KeyInput"
    input.Size = UDim2.new(1, -20, 1, 0)
    input.Position = UDim2.new(0, 10, 0, 0)
    input.BackgroundTransparency = 1
    input.Text = ""
    input.PlaceholderText = "在此输入卡密..."
    input.TextColor3 = Color3.fromRGB(255, 255, 255)
    input.PlaceholderColor3 = Color3.fromRGB(100, 100, 100)
    input.TextSize = 16
    input.Font = Enum.Font.Gotham
    input.ClearTextOnFocus = false
    input.Parent = inputBg
    
    -- 验证按钮
    local verifyBtn = Instance.new("TextButton")
    verifyBtn.Name = "VerifyButton"
    verifyBtn.Size = UDim2.new(1, -40, 0, 45)
    verifyBtn.Position = UDim2.new(0, 20, 0, 170)
    verifyBtn.BackgroundColor3 = Color3.fromRGB(233, 69, 96)
    verifyBtn.Text = "验证卡密"
    verifyBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
    verifyBtn.TextSize = 16
    verifyBtn.Font = Enum.Font.GothamBold
    verifyBtn.BorderSizePixel = 0
    verifyBtn.Parent = mainFrame
    
    local btnCorner = Instance.new("UICorner")
    btnCorner.CornerRadius = UDim.new(0, 8)
    btnCorner.Parent = verifyBtn
    
    -- 获取卡密按钮
    local getKeyBtn = Instance.new("TextButton")
    getKeyBtn.Name = "GetKeyButton"
    getKeyBtn.Size = UDim2.new(1, -40, 0, 35)
    getKeyBtn.Position = UDim2.new(0, 20, 0, 225)
    getKeyBtn.BackgroundTransparency = 1
    getKeyBtn.Text = "获取卡密"
    getKeyBtn.TextColor3 = Color3.fromRGB(100, 100, 100)
    getKeyBtn.TextSize = 14
    getKeyBtn.Font = Enum.Font.Gotham
    getKeyBtn.Parent = mainFrame
    
    -- 状态标签
    local status = Instance.new("TextLabel")
    status.Name = "Status"
    status.Size = UDim2.new(1, -40, 0, 25)
    status.Position = UDim2.new(0, 20, 0, 265)
    status.BackgroundTransparency = 1
    status.Text = ""
    status.TextColor3 = Color3.fromRGB(255, 255, 255)
    status.TextSize = 13
    status.Font = Enum.Font.Gotham
    status.Parent = mainFrame
    
    -- 按钮悬停效果
    verifyBtn.MouseEnter:Connect(function()
        game:GetService("TweenService"):Create(verifyBtn, TweenInfo.new(0.2), {
            BackgroundColor3 = Color3.fromRGB(255, 80, 110)
        }):Play()
    end)
    
    verifyBtn.MouseLeave:Connect(function()
        game:GetService("TweenService"):Create(verifyBtn, TweenInfo.new(0.2), {
            BackgroundColor3 = Color3.fromRGB(233, 69, 96)
        }):Play()
    end)
    
    getKeyBtn.MouseEnter:Connect(function()
        getKeyBtn.TextColor3 = Color3.fromRGB(150, 150, 150)
    end)
    
    getKeyBtn.MouseLeave:Connect(function()
        getKeyBtn.TextColor3 = Color3.fromRGB(100, 100, 100)
    end)
    
    return {
        ScreenGui = screenGui,
        MainFrame = mainFrame,
        Input = input,
        VerifyButton = verifyBtn,
        GetKeyButton = getKeyBtn,
        Status = status
    }
end

-- 获取 HWID (设备标识)
function KeySystem:GetHWID()
    local player = game.Players.LocalPlayer
    -- 组合多个标识符生成唯一ID
    local hwid = tostring(player.UserId) .. "_" .. game.PlaceId
    return hwid
end

-- 服务器端验证卡密
function KeySystem:VerifyKeyServer(key)
    local success, result = pcall(function()
        local HttpService = game:GetService("HttpService")
        local hwid = self:GetHWID()
        
        local data = {
            key = key,
            hwid = hwid
        }
        
        local response = game:HttpPost(
            CONFIG.API_URL .. "/api/verify",
            HttpService:JSONEncode(data),
            false,
            "application/json"
        )
        
        return HttpService:JSONDecode(response)
    end)
    
    if success then
        return result
    else
        warn("验证请求失败: " .. tostring(result))
        return { success = false, message = "网络错误，请重试" }
    end
end

-- 从服务器获取脚本
function KeySystem:GetScriptFromServer(key)
    local success, result = pcall(function()
        local HttpService = game:GetService("HttpService")
        local hwid = self:GetHWID()
        
        local data = {
            key = key,
            hwid = hwid
        }
        
        local response = game:HttpPost(
            CONFIG.API_URL .. "/api/get-script",
            HttpService:JSONEncode(data),
            false,
            "application/json"
        )
        
        return HttpService:JSONDecode(response)
    end)
    
    if success then
        return result
    else
        warn("获取脚本失败: " .. tostring(result))
        return { success = false, message = "网络错误" }
    end
end

-- 保存已验证的卡密（本地存储）
function KeySystem:SaveVerifiedKey(key)
    local HttpService = game:GetService("HttpService")
    local filename = "verified_key_" .. game.Players.LocalPlayer.UserId .. ".txt"
    
    if writefile then
        writefile(filename, key)
    end
end

-- 检查是否已验证
function KeySystem:IsAlreadyVerified()
    local filename = "verified_key_" .. game.Players.LocalPlayer.UserId .. ".txt"
    
    if isfile and isfile(filename) then
        return true, readfile(filename)
    end
    
    return false, nil
end

-- 显示成功界面
function KeySystem:ShowSuccessUI(parent, callback)
    local successFrame = Instance.new("Frame")
    successFrame.Name = "SuccessFrame"
    successFrame.Size = UDim2.new(1, 0, 1, 0)
    successFrame.BackgroundColor3 = Color3.fromRGB(25, 25, 35)
    successFrame.BorderSizePixel = 0
    successFrame.Parent = parent
    
    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 12)
    corner.Parent = successFrame
    
    -- 成功图标
    local icon = Instance.new("TextLabel")
    icon.Size = UDim2.new(0, 80, 0, 80)
    icon.Position = UDim2.new(0.5, -40, 0, 60)
    icon.BackgroundTransparency = 1
    icon.Text = "✓"
    icon.TextColor3 = Color3.fromRGB(46, 213, 115)
    icon.TextSize = 60
    icon.Font = Enum.Font.GothamBold
    icon.Parent = successFrame
    
    -- 成功文字
    local text = Instance.new("TextLabel")
    text.Size = UDim2.new(1, -40, 0, 40)
    text.Position = UDim2.new(0, 20, 0, 150)
    text.BackgroundTransparency = 1
    text.Text = "验证成功！"
    text.TextColor3 = Color3.fromRGB(255, 255, 255)
    text.TextSize = 24
    text.Font = Enum.Font.GothamBold
    text.Parent = successFrame
    
    -- 描述
    local desc = Instance.new("TextLabel")
    desc.Size = UDim2.new(1, -40, 0, 50)
    desc.Position = UDim2.new(0, 20, 0, 195)
    desc.BackgroundTransparency = 1
    desc.Text = "正在加载脚本..."
    desc.TextColor3 = Color3.fromRGB(150, 150, 150)
    desc.TextSize = 14
    desc.Font = Enum.Font.Gotham
    desc.Parent = successFrame
    
    -- 延迟执行回调
    task.delay(1.5, function()
        if callback then
            callback()
        end
        -- 可选：关闭 UI
        -- parent.Parent:Destroy()
    end)
end

-- 初始化卡密系统
function KeySystem:Init(onSuccessCallback)
    -- 检查是否已验证
    local isVerified, savedKey = self:IsAlreadyVerified()
    if isVerified then
        print("卡密已验证: " .. tostring(savedKey))
        if onSuccessCallback then
            onSuccessCallback()
        end
        return
    end
    
    -- 创建 UI
    local ui = self:CreateUI()
    
    -- 获取卡密按钮点击
    ui.GetKeyButton.MouseButton1Click:Connect(function()
        -- 复制链接到剪贴板
        local link = "https://114514541883484.github.io/gdky/"
        if setclipboard then
            setclipboard(link)
            ui.Status.Text = "链接已复制到剪贴板！"
            ui.Status.TextColor3 = Color3.fromRGB(46, 213, 115)
        else
            ui.Status.Text = "请访问: " .. link
            ui.Status.TextColor3 = Color3.fromRGB(100, 150, 255)
        end
    end)
    
    -- 验证按钮点击
    ui.VerifyButton.MouseButton1Click:Connect(function()
        local inputKey = ui.Input.Text:gsub("%s+", "") -- 去除空格
        
        if inputKey == "" then
            ui.Status.Text = "请输入卡密"
            ui.Status.TextColor3 = Color3.fromRGB(255, 71, 87)
            return
        end
        
        ui.Status.Text = "验证中..."
        ui.Status.TextColor3 = Color3.fromRGB(255, 255, 255)
        ui.VerifyButton.Text = "验证中..."
        ui.VerifyButton.Active = false
        
        task.spawn(function()
            -- 服务器端验证
            local verifyResult = self:VerifyKeyServer(inputKey)
            
            if not verifyResult.success then
                ui.Status.Text = verifyResult.message or "验证失败"
                ui.Status.TextColor3 = Color3.fromRGB(255, 71, 87)
                ui.VerifyButton.Text = "验证卡密"
                ui.VerifyButton.Active = true
                return
            end
            
            -- 保存验证状态
            self:SaveVerifiedKey(inputKey)
            
            ui.Status.Text = "验证成功！"
            ui.Status.TextColor3 = Color3.fromRGB(46, 213, 115)
            
            -- 显示成功界面
            self:ShowSuccessUI(ui.MainFrame, function()
                if onSuccessCallback then
                    onSuccessCallback()
                end
            end)
        end)
    end)
end

-- 导出模块
return KeySystem

-- ==================== 使用示例 ====================
--[[

-- 方式1：简单使用
local KeySystem = loadstring(game:HttpGet("https://114514541883484.github.io/gdky/roblox-script.lua"))()
KeySystem:Init(function()
    print("卡密验证通过，执行主脚本...")
    -- 在这里加载你的主脚本
end)

-- 方式2：带自定义配置
local KeySystem = loadstring(game:HttpGet("https://114514541883484.github.io/gdky/roblox-script.lua"))()
KeySystem.CONFIG.TITLE = "我的脚本"
KeySystem.CONFIG.DESCRIPTION = "请购买卡密后使用"
KeySystem:Init(function()
    print("验证成功！")
end)

--]]
