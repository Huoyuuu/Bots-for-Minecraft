const mineflayer = require('mineflayer')
const pathfinder = require('mineflayer-pathfinder')
const tool = require('mineflayer-tool')
const bot = mineflayer.createBot({
    username: "diamond_bot",
})
bot.loadPlugin(pathfinder.pathfinder)
bot.loadPlugin(tool.plugin)

async function get_diamond() {
    // 初始化
    const mcData = require('minecraft-data')(bot.version)
    const movements = new pathfinder.Movements(bot, mcData)
    movements.scafoldingBlocks = [mcData.blocksByName['dirt'].id]
    bot.pathfinder.setMovements(movements)
    while (1) {
        // 获取钻石矿石数组
        blocks = bot.findBlocks({
            matching: mcData.blocksByName['diamond_ore'].id,
            maxDistance: 256,
            count: 100
        })
        if (blocks.length == 0) {
            bot.chat("我找不到钻石")
            continue
        } else {
            bot.chat("我找到钻石了")
                // console.log(block)
        }

        // 剔除y值<8的部分，减少bot碰到岩浆的概率
        const filter = e => e.y >= 8
        blocks = blocks.filter(filter)
        console.log(blocks)

        // 遍历整个数组，挖掘对应钻石矿石
        for (i = 0; i < blocks.length; i++) {
            console.log(blocks[i])
            block = bot.world.getBlock(blocks[i])
            bot.tool.equipForBlock(block)

            // A*算法自动寻路
            const goal = new pathfinder.goals.GoalLookAtBlock(block.position, bot.world)
            try {
                // 挖掘钻石矿石
                await bot.pathfinder.goto(goal)
                await bot.dig(block)
            } catch {
                continue
            }
        }
    }
}

//开始挖矿
bot.once('spawn', get_diamond)

// 汇报信息
bot.on('chat', (username, message) => {
    if (username == bot.username) return
    const filter = e => e.name == 'diamond'
    console.log(bot.inventory.items().filter(filter))
})

// 初始化
bot.once('login', () => {
    bot.chat('/tp Huoyuuu')
    bot.chat('/gamemode 0')
})