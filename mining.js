/**
 * 自动挖矿模块
 * 
 * 该模块负责控制机器人进行自动挖矿。
 * 自动挖矿的主要步骤包括：
 * 1. 在指定范围内搜索目标方块
 * 2. 过滤掉不可达或不安全的方块
 * 3. 寻路到目标方块并挖掘
 * 4. 重复步骤1-3，直到达到指定的挖矿时间或背包已满
 */

const mineflayer = require('mineflayer');
const { goto } = require('./movement');
const { listInventory } = require('./inventory');
const { dropUselessItems } = require('./inventory');
const config = require('./botSetup');

/**
 * 开始自动挖矿
 * @param {Bot} bot - Mineflayer机器人实例
 */
async function startMining(bot) {
    console.log('开始自动挖矿');

    const miningBlocks = bot.findBlocks({
        matching: block => block.name === config.miningBlockName,
        maxDistance: config.miningRange,
        count: config.miningBlockCount,
    });

    while (miningBlocks.length > 0) {
        const filteredBlocks = miningBlocks.filter(isBlockSafe);
        if (filteredBlocks.length === 0) {
            console.log('没有可挖掘的安全方块');
            moveToNewArea(bot);
            continue;
        }

        for (const block of filteredBlocks) {
            try {
                await goto(bot, block.x, block.y, block.z);
                await mineBlock(bot, block);
                await waitForItemDrop(bot);

                if (bot.inventory.items().length >= config.inventoryFullThreshold) {
                    dropUselessItems(bot);
                }
            } catch (err) {
                console.log(`挖掘方块时出错: ${err.message} `);
                break;
            }
        }
    }

    console.log('自动挖矿结束');
    listInventory(bot);
}

/**
 * 挖掘指定方块
 * @param {Bot} bot - Mineflayer机器人实例
 * @param {Block} block - 要挖掘的方块
 */
async function mineBlock(bot, block) {
    console.log(`开始挖掘方块: ${block.name} (${block.x}, ${block.y}, ${block.z})`);

    try {
        await bot.dig(block);
    } catch (err) {
        console.log(`挖掘方块失败: ${err.message} `);
    }
}

/**
 * 等待物品掉落
 * @param {Bot} bot - Mineflayer机器人实例
 */
async function waitForItemDrop(bot) {
    return new Promise(resolve => {
        const listener = item => {
            if (item.name === config.miningItemName) {
                bot.removeListener('itemDrop', listener);
                resolve();
            }
        };
        bot.on('itemDrop', listener);
    });
}

/**
 * 判断方块是否安全可挖掘
 * @param {Block} block - 要判断的方块
 * @returns {boolean} - 方块是否安全可挖掘
 */
function isBlockSafe(block) {
    const blockAbove = bot.blockAt(block.position.offset(0, 1, 0));
    const blockBelow = bot.blockAt(block.position.offset(0, -1, 0));

    return !config.unsafeBlocks.includes(blockAbove.name) && blockBelow.name !== 'air';
}

/**
 * 移动到新的区域进行挖矿
 * @param {Bot} bot - Mineflayer机器人实例
 */
async function moveToNewArea(bot) {
    const { x, y, z } = bot.entity.position;
    const newPosition = new mineflayer.vec3(x + config.miningMoveDistance, y, z);

    try {
        await goto(bot, newPosition.x, newPosition.y, newPosition.z);
        console.log('已移动到新的挖矿区域');
    } catch (err) {
        console.log(`移动到新区域时出错: ${err.message} `);
    }
}

module.exports = {
    startMining,
};
