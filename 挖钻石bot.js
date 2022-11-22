/**
 * 挖钻石用bot v1.04
 * 
 * 支持功能：
 * 自动寻路
 * 自动切换工具
 * 自动挖掘钻石
 * 自动捡拾钻石
 * 
 * 简单来说，不用操作什么就能挖到钻石了
 * 
 * 更新：
 * 1. 借助直接判定优化对岩浆的处理方式，扩大可采集钻石矿石的范围，现y=4开始且不在岩浆旁边的钻石矿石均可采集。
 * 2. 增加了对多余物品的处理方式，先前直到塞满背包也会持续挖矿，修改后当物品占用范围超过30格时会自动丢弃圆石和各类石头以节省空间。
 * 3. 现聊天后同时会显示已占用背包的数目，以数字形式表示出来，如32等
 * 4. 聊天后显示的钻石数目为总数而非单组数目，如864等。
 * 5. 说出"give me"后，bot会自动走到身边并将所有的钻石交出去，说出"give me all"后，bot会自动走到身边并将所有的物品交出去。
 */

const mineflayer = require('mineflayer')
const pathfinder = require('mineflayer-pathfinder')
const tool = require('mineflayer-tool')
const { Vec3 } = require('vec3')
const bot = mineflayer.createBot({
    username: "diamond_bot",
    port: 6561,
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

    // 剔除y值<4的部分，避开基岩层
    const filter = e => no_lava(e) && e.y >= 4
    blocks = blocks.filter(filter)


    while (1) {
        if (blocks.length == 0) {
            bot.chat("我找不到钻石")
            try {
                pos = bot.entity.position.offset(100, 0, 100)
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
                bot.chat("出现问题")
                console.log(e)
                continue
            }
        }
    }
}

// 丢弃身上所有满组圆石 + 所有杂牌石头
async function dropThings() {
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
    const filter = e => e.name == 'diamond'
    var D2 = (new Date).getTime()

    // 毫秒换算成秒
    bot.chat(`距今已运行${(D2 - D1) / 1000}秒`)
    count = 0
    box = bot.inventory.items().filter(filter)
    len = box.length
    for (i = 0; i < len; i++) {
        count += box[i].count
    }
    bot.chat(`已挖到${count}个钻石`)
    bot.chat(`总占用${bot.inventory.items().length}格`)

    //交出身上所有钻石
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

    //交出身上所有物品
    if (message == "give me all") {
        bot.pathfinder.setGoal(new pathfinder.goals.GoalFollow(bot.players['Huoyuuu'].entity));
        all_things = bot.inventory.slots
        all_items = bot.inventory.items()
        for (i = 0; i < all_items.length; i++) {
            await bot.tossStack(all_things[all_items[i].slot]);
        }
    }
})