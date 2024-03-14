/**
 * 机器人初始化与事件处理模块
 * 
 * 该模块负责创建和初始化Mineflayer机器人实例，并注册各种事件监听器。
 * 事件监听器包括：
 * - 'spawn': 机器人生成时触发
 * - 'login': 机器人登录时触发
 * - 'chat': 机器人接收到聊天消息时触发
 * - 'health': 机器人生命值变化时触发
 */

const mineflayer = require('mineflayer');
const pathfinder = require('mineflayer-pathfinder').pathfinder;
const autoeat = require('mineflayer-auto-eat').plugin;
const inventoryViewer = require('mineflayer-web-inventory');
const config = require('./botSetup');

/**
 * 创建Mineflayer机器人实例
 * @param {string} botName - 机器人名称
 * @returns {Bot} - Mineflayer机器人实例
 */
function createBot(botName) {
    const bot = mineflayer.createBot({
        username: botName,
    });

    // 加载插件
    bot.loadPlugin(pathfinder);
    bot.loadPlugin(autoeat);

    return bot;
}

/**
 * 注册机器人事件监听器
 * @param {Bot} bot - Mineflayer机器人实例
 */
function registerEventListeners(bot) {
    // 'spawn'事件监听器
    bot.once('spawn', () => {
        console.log(`机器人 ${bot.username} 已生成`);
        inventoryViewer(bot, { port: config.inventoryViewerPort });
    });

    // 'login'事件监听器
    bot.once('login', () => {
        console.log(`机器人 ${bot.username} 已登录`);
        bot.chat(config.loginCommand);
    });

    // 'chat'事件监听器
    bot.on('chat', (username, message) => {
        if (username === bot.username) return;
        // TODO: 在聊天命令处理模块中实现
        handleChatCommand(bot, username, message);
    });

    // 'health'事件监听器
    bot.on('health', () => {
        if (bot.food >= config.autoEatThreshold) {
            bot.autoEat.disable();
            console.log('机器人吃东西结束');
        } else {
            bot.autoEat.enable();
            console.log('机器人开始吃东西');
        }
    });
}

module.exports = {
    createBot,
    registerEventListeners,
};