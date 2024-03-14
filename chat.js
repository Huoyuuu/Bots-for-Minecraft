/**
 * 聊天命令处理模块
 * 
 * 该模块负责处理机器人接收到的聊天命令。
 * 支持的命令包括：
 * - 'go': 机器人移动到指定位置或跟随指定玩家
 * - 'tp': 机器人接受传送请求
 * - 'mine': 机器人开始自动挖矿
 * - 'list': 显示机器人背包中的物品
 * - 'chest': 机器人与箱子进行交互
 * - 'help': 显示帮助信息
 */

const config = require('./config');
const { goto, followPlayer, stopMoving } = require('./movement');
const { startMining } = require('./mining');
const { listInventory } = require('./inventory');
const { interactWithChest } = require('./chestInteraction');

/**
 * 处理聊天命令
 * @param {Bot} bot - Mineflayer机器人实例
 * @param {string} username - 发送命令的玩家用户名
 * @param {string} message - 聊天消息内容
 */
function handleChatCommand(bot, username, message) {
    const args = message.split(' ');
    const command = args[0];

    switch (command) {
        case 'go':
            handleGoCommand(bot, args);
            break;
        case 'tp':
            bot.chat(config.tpAcceptCommand);
            break;
        case 'mine':
            startMining(bot);
            break;
        case 'list':
            listInventory(bot);
            break;
        case 'chest':
            handleChestCommand(bot, args);
            break;
        case 'help':
            displayHelpMessage(bot, username);
            break;
        default:
            bot.chat(`未知命令: ${command}`);
    }
}

/**
 * 处理'go'命令
 * @param {Bot} bot - Mineflayer机器人实例
 * @param {string[]} args - 命令参数
 */
function handleGoCommand(bot, args) {
    const subCommand = args[1];
    const targetName = args[2];

    if (subCommand === 'follow') {
        followPlayer(bot, targetName);
    } else if (subCommand === 'stop') {
        stopMoving(bot);
    } else {
        const x = parseInt(args[1]);
        const y = parseInt(args[2]);
        const z = parseInt(args[3]);
        goto(bot, x, y, z);
    }
}

/**
 * 处理'chest'命令
 * @param {Bot} bot - Mineflayer机器人实例
 * @param {string[]} args - 命令参数
 */
function handleChestCommand(bot, args) {
    const subCommand = args[1];

    if (subCommand === 'all') {
        const action = args[2];
        if (action === 'in') {
            interactWithChest(bot, 'depositAll');
        } else if (action === 'out') {
            interactWithChest(bot, 'withdrawAll');
        } else {
            bot.chat(`未知操作: ${action}`);
        }
    } else {
        const itemName = args[1];
        const itemCount = parseInt(args[2]);
        if (subCommand === 'in') {
            interactWithChest(bot, 'deposit', itemName, itemCount);
        } else if (subCommand === 'out') {
            interactWithChest(bot, 'withdraw', itemName, itemCount);
        } else {
            bot.chat(`未知命令: ${subCommand}`);
        }
    }
}

/**

显示帮助信息
@param {Bot} bot - Mineflayer机器人实例
@param {string} username - 请求帮助的玩家用户名
*/
function displayHelpMessage(bot, username) {
    const helpMessage = `
    可用命令:
    go [follow|stop|<x> <y> <z>]: 移动到指定位置或跟随指定玩家
    tp: 接受传送请求
    mine: 开始自动挖矿
    list: 显示背包中的物品
    chest [all in|all out|in <item> <count>|out <item> <count>]: 与箱子交互
    help: 显示此帮助信息
    `;
    bot.whisper(username, helpMessage);
}
module.exports = {
    handleChatCommand,
};