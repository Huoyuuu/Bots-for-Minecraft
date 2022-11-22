const mineflayer = require('mineflayer')
const pathfinder = require('mineflayer-pathfinder')
const bot = mineflayer.createBot({
    username: "wood_bot"
})
bot.loadPlugin(pathfinder.pathfinder)

bot.once('spawn', getWood)

async function getWood() {
    const mcData = require('minecraft-data')(bot.version)
    const movements = new pathfinder.Movements(bot, mcData)
    movements.scafoldingBlocks = [mcData.blocksByName['log'].id]
    bot.pathfinder.setMovements(movements)
    while (1) {
        const block = bot.findBlock({
            matching: mcData.blocksByName['log'].id,
            maxDistance: 32,
        })
        if (!block) {
            bot.chat("我找不到木头")
            bot.placeBlock(bot.entity.position, Vec3(0, 1, 0))
            continue
        } else {
            bot.chat("我找到木头了")
            console.log(block)
        }
        const goal = new pathfinder.goals.GoalLookAtBlock(block.position, bot.world)
        try {
            await bot.pathfinder.goto(goal)
            await bot.dig(block)
        } catch {
            continue
        }
    }
}