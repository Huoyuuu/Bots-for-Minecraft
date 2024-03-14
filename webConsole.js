/**
 * Web界面与控制台交互模块
 * 
 * 该模块提供了与Web界面和控制台进行交互的功能。
 * 主要功能包括：
 * - 启动Web服务器，提供机器人状态查询和控制接口
 * - 处理控制台命令，如启动/停止挖矿、显示背包等
 */

const express = require('express');
const bodyParser = require('body-parser');
const config = require('./botSetup');
const { startMining, stopMining } = require('./mining');
const { listInventory } = require('./inventory');
const { goto } = require('./movement');

let bot;

/**
 * 初始化Web服务器
 * @param {Bot} botInstance - Mineflayer机器人实例
 */
function initWebServer(botInstance) {
    bot = botInstance;

    const app = express();
    app.use(bodyParser.json());

    app.get('/status', (req, res) => {
        const status = {
            position: bot.entity.position,
            health: bot.health,
            food: bot.food,
            experience: bot.experience,
        };
        res.json(status);
    });

    app.post('/control', (req, res) => {
        const { action, data } = req.body;
        handleControlCommand(action, data);
        res.send('OK');
    });

    app.listen(config.webServerPort, () => {
        console.log(`Web服务器已启动，端口: ${config.webServerPort} `);
    });
}

/**
 * 处理控制台命令
 */
function handleConsoleCommand() {
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.on('line', input => {
        const [action, ...data] = input.split(' ');
        handleControlCommand(action, data);
    });
}

/**
 * 处理控制命令
 * @param {string} action - 命令动作
 * @param {Array} data - 命令数据
 */
function handleControlCommand(action, data) {
    switch (action) {
        case 'startMining':
            startMining(bot);
            break;
        case 'stopMining':
            stopMining(bot);
            break;
        case 'listInventory':
            listInventory(bot);
            break;
        case 'goto':
            const [x, y, z] = data.map(Number);
            goto(bot, x, y, z);
            break;
        default:
            console.log(`未知命令: ${action} `);
    }
}

module.exports = {
    initWebServer,
    handleConsoleCommand,
};