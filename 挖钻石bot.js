/**
 * 挖钻石用bot
 * 
 * 支持功能：
 * 自动寻路
 * 自动切换工具
 * 自动挖掘钻石
 * 自动捡拾钻石
 * 
 * 简单来说，什么都不用操作就能挖到钻石了
 */

const mineflayer = require('mineflayer')
const pathfinder = require('mineflayer-pathfinder')
const tool = require('mineflayer-tool')
const bot = mineflayer.createBot({
    username: "diamond_bot",
    port: 4190,
})
bot.loadPlugin(pathfinder.pathfinder)
bot.loadPlugin(tool.plugin)

// 显示所有已知钻石矿石与bot的距离，以数组形式展示出来
function disp(blocks) {
    len = blocks.length
    num = new Array()
    for (i = 0; i < len; i++) {
        num.push(blocks[i].distanceTo(bot.entity.position))
    }
    console.log(num)
}

// 全自动挖钻石工作
async function get_diamond() {
    // 初始化
    const mcData = require('minecraft-data')(bot.version)
    const movements = new pathfinder.Movements(bot, mcData)
    movements.scafoldingBlocks.push(mcData.blocksByName['stone'].id)
    movements.scafoldingBlocks.push(mcData.blocksByName['cobblestone'].id)
    bot.pathfinder.setMovements(movements)
    blocks = bot.findBlocks({
        matching: mcData.blocksByName['diamond_ore'].id,
        maxDistance: 90,
        count: 50
    })

    // 剔除y值<8的部分，减少bot碰到岩浆的概率
    const filter = e => e.y >= 8
    blocks = blocks.filter(filter)


    while (1) {
        if (blocks.length == 0) {
            bot.chat("我找不到钻石")
            try {
                pos = bot.entity.position.offset(100, 0, 100)
                new_area_goal = new pathfinder.goals.GoalLookAtBlock(pos ``)
                await bot.pathfinder.goto(new_area_goal)
                continue
            } catch {
                continue
            }
        } else {
            bot.chat("我找到钻石了")
                // console.log(block)
        }

        // 遍历整个数组，挖掘对应钻石矿石
        for (i = 0; i < blocks.length; i++) {
            block = bot.world.getBlock(blocks.shift())
            if (!block) continue
            bot.chat(`${block.position.distanceTo(bot.entity.position)}`)

            // 调试 
            // disp(blocks)
            // console.log(block.position.distanceTo(bot.entity.position))

            // A*算法自动寻路
            goal = new pathfinder.goals.GoalBlock(block.position.x, block.position.y, block.position.z)
            console.log(block.position)
            try {
                // 挖掘钻石矿石
                await bot.pathfinder.goto(goal)
                await bot.tool.equipForBlock(block)
                await bot.dig(block)
                bot.pathfinder.setGoal(goal)
                blocks = bot.findBlocks({
                    matching: mcData.blocksByName['diamond_ore'].id,
                    maxDistance: 90,
                    count: 50
                })

                // 剔除y值<8的部分，减少bot碰到岩浆的概率
                const filter = e => e.y >= 8
                blocks = blocks.filter(filter)
            } catch (e) {
                bot.chat("出现问题")
                console.log(e)
                continue
            }
        }
    }
}

// 开始挖矿
bot.once('spawn', get_diamond)

// 汇报信息
var D1 = (new Date).getTime()
bot.on('chat', (username, message) => {
    if (username == bot.username) return
    const filter = e => e.name == 'diamond'
    var D2 = (new Date).getTime()

    // 毫秒换算成秒
    bot.chat(`距今已运行${(D2 - D1) / 1000}秒`)
    bot.chat(`已挖到${bot.inventory.items().filter(filter)[0].count}个钻石`)
    console.log(bot.inventory.items().filter(filter))
})

// 初始化
bot.once('login', () => {
    bot.chat('/tp Huoyuuu')
    bot.chat('/gamemode 0')
})