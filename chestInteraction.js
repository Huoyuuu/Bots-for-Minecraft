/**
 * 箱子交互模块
 * 
 * 该模块提供了与箱子进行交互的功能。
 * 主要功能包括：
 * - 打开附近的箱子
 * - 将物品存入箱子
 * - 从箱子中取出物品
 */

const mineflayer = require('mineflayer');

/**
 * 与箱子交互
 * @param {Bot} bot - Mineflayer机器人实例
 * @param {string} action - 交互操作：'deposit' 存入, 'withdraw' 取出, 'depositAll' 全部存入, 'withdrawAll' 全部取出
 * @param {string} [itemName] - 物品名称
 * @param {number} [itemCount] - 物品数量
 */
async function interactWithChest(bot, action, itemName, itemCount) {
    const chestBlock = bot.findBlock({
        matching: block => block.name.includes('chest'),
        maxDistance: 5,
    });

    if (!chestBlock) {
        bot.chat('附近没有箱子');
        return;
    }

    const chest = await bot.openChest(chestBlock);
    console.log(`已打开箱子: ${chestBlock.name}`);

    switch (action) {
        case 'depositAll':
            await depositAllItems(chest);
            break;
        case 'withdrawAll':
            await withdrawAllItems(chest);
            break;
        case 'deposit':
            await depositItems(chest, itemName, itemCount);
            break;
        case 'withdraw':
            await withdrawItems(chest, itemName, itemCount);
            break;
        default:
            bot.chat(`未知操作: ${action}`);
    }

    chest.close();
    console.log(`已关闭箱子: ${chestBlock.name}`);
}

/**
 * 将所有物品存入箱子
 * @param {Chest} chest - 箱子实例
 */
async function depositAllItems(chest) {
    const inventory = chest.window.slots;
    for (const item of inventory) {
        if (item) {
            await chest.deposit(item.type, null, item.count);
        }
    }
    console.log('已将所有物品存入箱子');
}

/**
 * 从箱子中取出所有物品
 * @param {Chest} chest - 箱子实例
 */
async function withdrawAllItems(chest) {
    const chestItems = chest.items();
    for (const item of chestItems) {
        await chest.withdraw(item.type, null, item.count);
    }
    console.log('已从箱子中取出所有物品');
}

/**
 * 将指定物品存入箱子
 * @param {Chest} chest - 箱子实例
 * @param {string} itemName - 物品名称
 * @param {number} itemCount - 物品数量
 */
async function depositItems(chest, itemName, itemCount) {
    const inventory = chest.window.slots;
    for (const item of inventory) {
        if (item && item.name === itemName && itemCount > 0) {
            const count = Math.min(item.count, itemCount);
            await chest.deposit(item.type, null, count);
            itemCount -= count;
        }
    }
    console.log(`已将 ${itemName} x ${itemCount} 存入箱子`);
}

/**
 * 从箱子中取出指定物品
 * @param {Chest} chest - 箱子实例
 * @param {string} itemName - 物品名称
 * @param {number} itemCount - 物品数量
 */
async function withdrawItems(chest, itemName, itemCount) {
    const chestItems = chest.items();
    for (const item of chestItems) {
        if (item.name === itemName && itemCount > 0) {
            const count = Math.min(item.count, itemCount);
            await chest.withdraw(item.type, null, count);
            itemCount -= count;
        }
    }
    console.log(`已从箱子中取出 ${itemName} x ${itemCount}`);
}

module.exports = {
    interactWithChest,
};