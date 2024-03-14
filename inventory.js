/**
 * 背包管理与物品丢弃模块
 * 
 * 该模块提供了管理机器人背包和丢弃物品的功能。
 * 主要功能包括：
 * - 列出背包中的物品
 * - 丢弃无用的物品，如沙子、泥土等
 */

const config = require('./botSetup');

/**
 * 列出背包中的物品
 * @param {Bot} bot - Mineflayer机器人实例
 */
function listInventory(bot) {
    const items = bot.inventory.items();
    console.log('背包物品:');
    items.forEach(item => {
        console.log(`- ${item.name} x ${item.count}`);
    });
}

/**
 * 丢弃无用的物品
 * @param {Bot} bot - Mineflayer机器人实例
 */
function dropUselessItems(bot) {
    const uselessItems = bot.inventory.items().filter(item => config.uselessItems.includes(item.name));
    uselessItems.forEach(item => {
        bot.tossStack(item);
        console.log(`已丢弃无用物品: ${item.name} x ${item.count}`);
    });
}

module.exports = {
    listInventory,
    dropUselessItems,
};