/**
 * 挖钻石用bot v1.05
 * 
 * 支持功能：
 * 自动寻路
 * 自动切换工具
 * 自动挖掘钻石
 * 自动捡拾钻石
 * 自动清除杂物
 * 支持通过聊天区进行沟通，参见bot.on('chat', async(username, message)部分的注释
 * 
 * 简单来说，不用操作什么就能挖到钻石了
 * 
 * 更新：
 * 1. 优化出现异常后的处理方式，防止长时间卡住的情况
 * 2. 背包满员后可以进一步清空背包，给钻石留出更多的空间
 * 3. 局部进行了微调
 */

const mineflayer = require('mineflayer')
const pathfinder = require('mineflayer-pathfinder')
const tool = require('mineflayer-tool')
const { Vec3 } = require('vec3')
const bot = mineflayer.createBot({
    username: "diamond_bot",
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
    movements.scafoldingBlocks = []
    movements.scafoldingBlocks.push(mcData.blocksByName['stone'].id)
    movements.scafoldingBlocks.push(mcData.blocksByName['cobblestone'].id)
    bot.pathfinder.setMovements(movements)
    blocks = bot.findBlocks({
        matching: mcData.blocksByName['diamond_ore'].id,
        maxDistance: 90,
        count: 50
    })

    // 剔除y值<4的部分，避开基岩层
    const filter = e => no_lava(e) && e.y >= 4
    blocks = blocks.filter(filter)


    while (1) {
        if (blocks.length == 0) {
            bot.chat("我找不到钻石")
            try {
                pos = bot.entity.position.offset(50, 0, 50)
                new_area_goal = new pathfinder.goals.GoalLookAtBlock(pos)
                await bot.pathfinder.goto(new_area_goal)
                continue
            } catch {
                continue
            }
        } else {
            bot.chat("我找到钻石了")
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
            // console.log(block.position)
            goal = new pathfinder.goals.GoalBlock(block.position.x, block.position.y, block.position.z)
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

                // 背包接近满员时开始丢弃杂物
                if (bot.inventory.items().length >= 30) {
                    dropThings()
                }

                // 剔除y值<4的部分，避开基岩层
                const filter = e => no_lava(e) && e.y >= 4
                blocks = blocks.filter(filter)
            } catch (e) {
                bot.chat("出现问题  尝试解决ing")
                bot.stopDigging()
                console.log(e)
                continue
            }
        }
    }
}

async function dropThings() {

    // 丢弃身上所有满组圆石 + 所有杂牌石头
    if (bot.inventory.items().length <= 34) {
        items = bot.inventory.slots
        len = items.length
        for (i = 0; i < len; i++) {
            item = items[i]
            if (!item) continue
            if (item.name == 'cobblestone' && item.count == 64) {
                await bot.tossStack(bot.inventory.slots[item.slot])
            }
            if (item.name == 'stone') {
                await bot.tossStack(bot.inventory.slots[item.slot])
            }
        }
    }

    // 丢弃身上除钻石和工具外的绝大多数物品
    else {
        items = bot.inventory.slots
        len = items.length
        for (i = 0; i < len; i++) {
            item = items[i]
            if (!item) continue
            if (item.name == 'diamond') {
                continue
            }
            if (item.count == 1) {
                continue
            }
            await bot.tossStack(bot.inventory.slots[item.slot])
        }
    }
}

//判定方块六个表面是否有岩浆
function no_lava(block) {
    x = block.x
    y = block.y
    z = block.z
    I = [1, -1, 0, 0, 0, 0]
    J = [0, 0, 1, -1, 0, 0]
    K = [0, 0, 0, 0, 1, -1]
    for (t = 0; t < 6; t++) {
        i = I[t], j = J[t], k = K[t]
        tmp = bot.world.getBlock(new Vec3(x + i, y + j, z + k))
        if (!tmp) continue
        if (tmp.name == 'lava') {
            return false
        }
    }
    return true
}

function get_run_time() {

    // 毫秒换算成秒
    var D2 = (new Date).getTime()
    return (D2 - D1) / 1000
}

// 初始化
bot.once('login', () => {
    bot.chat('/tp Huoyuuu')
    bot.chat('/gamemode 0')
})

// 开始挖矿
bot.once('spawn', get_diamond)

// 汇报信息
var D1 = (new Date).getTime()
bot.on('chat', async(username, message) => {
    if (username == bot.username) return

    // 简要汇报
    if (message == 'show' || message == 'show all') {

        // 运行时间
        bot.chat(`已运行${get_run_time()}秒`)

        filter = e => e.name == 'diamond'
        box = bot.inventory.items().filter(filter)
        len = box.length
        count = 0
        for (i = 0; i < len; i++) {
            count += box[i].count
        }
        bot.chat(`已挖到${count}个钻石`)
        bot.chat(`钻石总占用${len}格`)
        bot.chat(`背包总占用${bot.inventory.items().length}格`)
    }

    // 详细汇报 -> 注意具体信息均显示在控制台上
    if (message == 'show all') {
        items = bot.inventory.items();
        console.log(items)
        console.log(`已挖到${count}个钻石`)
        console.log(`钻石总占用${len}格`)
        console.log(`背包总占用${bot.inventory.items().length}格`)
    }

    // 交出身上所有钻石
    if (message == "give me") {
        bot.pathfinder.setGoal(new pathfinder.goals.GoalFollow(bot.players['Huoyuuu'].entity));
        all_things = bot.inventory.slots
        all_items = bot.inventory.items()
        for (i = 0; i < all_items.length; i++) {
            if (all_items[i].name == 'diamond') {
                await bot.tossStack(all_things[all_items[i].slot]);
            }
        }
    }

    // 交出身上所有物品
    if (message == "give me all") {
        bot.pathfinder.setGoal(new pathfinder.goals.GoalFollow(bot.players['Huoyuuu'].entity));
        all_things = bot.inventory.slots
        all_items = bot.inventory.items()
        for (i = 0; i < all_items.length; i++) {
            await bot.tossStack(all_things[all_items[i].slot]);
        }
    }
})