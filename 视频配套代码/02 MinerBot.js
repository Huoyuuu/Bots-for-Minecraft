const mineflayer = require('mineflayer')
const pathfinder = require('mineflayer-pathfinder')
const tool = require('mineflayer-tool')


const bot = mineflayer.createBot({
    port: 12307,
})


bot.loadPlugin(pathfinder.pathfinder)
bot.loadPlugin(tool.plugin)

bot.on('spawn', async() => {
    // 1 找到要挖掘的方块
    const blocks = bot.findBlocks({
        matching: 1,
        count: 32
    })
    console.log(blocks)

    // 2 具体挖掘过程
    for (const block of blocks) {
        try {
            // 走到方块处
            const goal_block = new pathfinder.goals.GoalBlock(block.x, block.y, block.z)
            await bot.pathfinder.goto(goal_block)

            // 准备好工具
            block_in_MC = bot.world.getBlock(block.x, block.y, block.z)
            await bot.tool.equipForBlock(block_in_MC)

            // 开始挖掘
            await bot.dig(block_in_MC)
        } catch (e) {
            continue
        }
    }

    // 3 异常处理
})