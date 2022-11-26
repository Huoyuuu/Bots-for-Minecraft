/**
 * 挖矿用bot v1.06
 * 
 * 支持功能：
 * 自动寻路
 * 自动切换工具
 * 自动挖掘矿物
 * 自动捡拾矿物
 * 自动丢弃杂物
 * 支持通过聊天区进行沟通，参见bot.on('chat', async(username, message)部分的注释
 * 
 * 简单来说，不用操作什么就能挖到各种矿物了
 * 
 * v1.06更新：
 * 1. 提高movements中液体权重，避免从水和岩浆等流体旁经过。
 * 2. 泛化矿石，可以挖掘多种类型的矿物，只需指定文件前两行的goal_block和goal_item参数即可
 * 3. bot改名为miner_bot
 */

// 矿石名
const goal_block = 'diamond_ore'

// 矿物名
const goal_item = 'diamond'

// 提示消息中出现的名字
const goal_name = '钻石'

// 管理员名字
const admin_name = 'Huoyuuu'

const mineflayer = require('mineflayer')
const pathfinder = require('mineflayer-pathfinder')
const tool = require('mineflayer-tool')
const { Vec3 } = require('vec3')
const bot = mineflayer.createBot({
    username: 'miner_bot',
    port: 14842,
})
bot.loadPlugin(pathfinder.pathfinder)
bot.loadPlugin(tool.plugin)

// 显示所有已知矿石与bot的距离，以数组形式展示出来
function disp(blocks) {
    len = blocks.length
    num = new Array()
    for (i = 0; i < len; i++) {
        num.push(blocks[i].distanceTo(bot.entity.position))
    }
    console.log(num)
}

// 全自动挖矿工作
async function get_diamond() {

    // 初始化
    const mcData = require('minecraft-data')(bot.version)
    const movements = new pathfinder.Movements(bot, mcData)
    movements.scafoldingBlocks = []
    movements.scafoldingBlocks.push(mcData.blocksByName['stone'].id)
    movements.scafoldingBlocks.push(mcData.blocksByName['cobblestone'].id)
    movements.blocksToAvoid.add(mcData.blocksByName['lava'].id)
    movements.liquidCost = 30
    bot.pathfinder.setMovements(movements)
    blocks = bot.findBlocks({
        matching: mcData.blocksByName[goal_block].id,
        maxDistance: 90,
        count: 30
    })

    // 剔除y值<4的部分，避开基岩层
    const filter = e => no_lava(e) && e.y >= 4
    blocks = blocks.filter(filter)


    while (1) {
        if (blocks.length == 0) {
            bot.chat("我找不到" + goal_name)
            try {
                pos = bot.entity.position.offset(50, 0, 50)
                new_area_goal = new pathfinder.goals.GoalLookAtBlock(pos, bot.world)
                await bot.pathfinder.goto(new_area_goal)
                continue
            } catch {
                continue
            }
        } else {
            bot.chat("我找到" + goal_name + "了")
        }

        // 遍历整个数组，挖掘对应矿石
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
                // 挖掘对应矿石
                await bot.pathfinder.goto(goal)
                await bot.tool.equipForBlock(block)
                await bot.dig(block)
                bot.pathfinder.setGoal(goal)
                blocks = bot.findBlocks({
                    matching: mcData.blocksByName[goal_block].id,
                    maxDistance: 90,
                    count: 20
                })

                // 背包接近满员时开始丢弃杂物
                if (bot.inventory.items().length >= 30) {
                    dropThings()
                }

                // 剔除y值<4的部分，避开基岩层
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

    // 丢弃身上除矿物和工具外的绝大多数物品
    else {
        items = bot.inventory.slots
        len = items.length
        for (i = 0; i < len; i++) {
            item = items[i]
            if (!item) continue
            if (item.name == goal_item) {
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
    // 获取运行时间
    var D2 = (new Date).getTime()
    return (D2 - D1) / 1000
}

// 初始化
bot.once('login', () => {
    bot.chat('/tp ' + admin_name)
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

        filter = e => e.name == goal_item
        box = bot.inventory.items().filter(filter)
        len = box.length
        count = 0
        for (i = 0; i < len; i++) {
            count += box[i].count
        }
        bot.chat(`已挖到${count}个${goal_name}`)
        bot.chat(`${goal_name}总占用${len}格`)
        bot.chat(`背包总占用${bot.inventory.items().length}格`)
    }

    // 详细汇报 -> 注意具体信息均显示在控制台上
    if (message == 'show all') {
        items = bot.inventory.items();
        console.log(items)
        console.log(`已挖到${count}个${goal_name}`)
        console.log(`${goal_name}总占用${len}格`)
        console.log(`背包总占用${bot.inventory.items().length}格`)
    }

    // 交出身上所有矿物
    if (message == "give me") {
        bot.pathfinder.setGoal(new pathfinder.goals.GoalFollow(bot.players[admin_name].entity));
        all_things = bot.inventory.slots
        all_items = bot.inventory.items()
        for (i = 0; i < all_items.length; i++) {
            if (all_items[i].name == goal_item) {
                await bot.tossStack(all_things[all_items[i].slot]);
            }
        }
    }

    // 交出身上所有物品
    if (message == "give me all") {
        bot.pathfinder.setGoal(new pathfinder.goals.GoalFollow(bot.players[admin_name].entity));
        all_things = bot.inventory.slots
        all_items = bot.inventory.items()
        for (i = 0; i < all_items.length; i++) {
            await bot.tossStack(all_things[all_items[i].slot]);
        }
    }

    if (message == 'stop') {
        bot.stopDigging()
        bot.pathfinder.stop()
    }
})