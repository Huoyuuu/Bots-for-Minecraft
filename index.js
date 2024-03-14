/**
 * 主文件
 */

const config = require('./botSetup');
const { createBot, registerEventListeners } = require('./botSetup');
const { initWebServer, handleConsoleCommand } = require('./webConsole');

// 创建机器人实例
const bot = createBot(config.botName);

// 注册事件监听器
registerEventListeners(bot);

// 初始化Web服务器
initWebServer(bot);

// 处理控制台命令
handleConsoleCommand(bot);
