/**
 * 寻路与移动模块
 * 
 * 该模块提供了控制机器人移动和寻路的功能。
 * 主要功能包括：
 * - 移动到指定坐标
 * - 跟随指定玩家
 * - 停止移动
 */

const mineflayer = require('mineflayer');
const { GoalNear } = require('mineflayer-pathfinder').goals;

/**
 * 移动到指定坐标
 * @param {Bot} bot - Mineflayer机器人实例
 * @param {number} x - 目标X坐标
 * @param {number} y - 目标Y坐标
 * @param {number} z - 目标Z坐标
 */
async function goto(bot, x, y, z) {
    const goal = new GoalNear(x, y, z, 1);
    await bot.pathfinder.goto(goal);
}

/**
 * 跟随指定玩家
 * @param {Bot} bot - Mineflayer机器人实例
 * @param {string} playerName - 要跟随的玩家名称
 */
async function followPlayer(bot, playerName) {
    const player = bot.players[playerName];
    if (!player) {
        bot.chat(`找不到玩家: ${playerName}`);
        return;
    }

    const goal = new GoalNear(player.entity.position.x, player.entity.position.y, player.entity.position.z, 2);
    bot.pathfinder.setGoal(goal, true);
    bot.chat(`开始跟随玩家: ${playerName}`);
}

/**
 * 停止移动
 * @param {Bot} bot - Mineflayer机器人实例
 */
function stopMoving(bot) {
    bot.pathfinder.setGoal(null);
    bot.chat('已停止移动');
}

module.exports = {
    goto,
    followPlayer,
    stopMoving,
};
