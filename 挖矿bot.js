/**
 * 挖矿用bot v1.1
 * 
 * 支持功能：
 * 自动寻路
 * 自动挖矿（mine）
 * 自动丢弃杂物
 * 自动跟随指定目标（go）
 * 显示背包内的物品（list）
 * 与箱子进行交互（chest -> all in/out)
 * 在本地网页端显示背包实时情况（地址：127.0.0.1:3001）
 * 支持在控制台操作bot
 * 
 * 简单来说，不用操作什么就能挖到矿物了
 * 
 * v1.1更新：
 * 1. 为bot多开预留了空间
 * 2. 增加在网页端显示背包物品的功能，可以更清楚地看到背包情况。
 * 3. 增加在控制台控制bot的功能，比如直接在控制台输入bot.chat("Hi")。
 * 4. 增加chest指令，让bot可以与箱子进行交互，现在可以直接通过箱子提交矿物了。
 * 5. 增加go指令，让bot自动前往指定目标。
 * 6. 增加help指令，提供帮助手册。
 * 7. 丢弃物品部分新增了地狱岩和玄武岩，现在bot也适合放到地狱挖下界残骸。
 * 8. 去除bot不必要的消息提示，改为显示在控制台上。
 */

// bot_name = process.argv[2]
bot_name = "Bot1"
admin_name = "Huoyuuu"
    // 矿石名 + 矿物名 + 提示消息中出现的名字
var goal_block = 'ancient_debris'
var goal_item = 'ancient_debris'
var goal_name = 'ancient_debris'

const mineflayer = require('mineflayer')
const pathfinder = require('mineflayer-pathfinder')
const tool = require('mineflayer-tool')
const { Vec3 } = require('vec3')
const repl = require('repl')
const autoeat = require('mineflayer-auto-eat').plugin
const inventoryViewer = require('mineflayer-web-inventory')
    // const mineflayerViewer = require('prismarine-viewer').mineflayer
const bot = mineflayer.createBot({
    username: bot_name
})
bot.loadPlugin(pathfinder.pathfinder)
bot.loadPlugin(tool.plugin)
bot.loadPlugin(autoeat)
bot.once('spawn', () => {
    // mineflayerViewer(bot, { port: 3000 })
    inventoryViewer(bot, { port: 3001 })

    // 多开时注释掉下面的bot.on('chat', botBegin)
    bot.on('chat', botBegin)
    console.log(bot.entity.position)
})
bot.once('login', () => {
    if (process.argv.length > 3) {
        bot.chat("/register 123456 123456")
    } else {
        bot.chat("/login 123456 123456")
    }
})
bot.on('login', () => {
    const r = repl.start('> ')
    r.context.bot = bot

    r.on('exit', () => {
        bot.end()
    })
})
bot.on('chat', (username, message) => {
    console.log(username + ':' + message)

    // 多开时注释掉下面的return
    return
    if (username == bot_name) return
    message = message.split(' ')
    if (message[0] == bot_name) {
        if (message[1] == "begin") {
            bot.chat("我在")
            bot.on('chat', botBegin)
        } else if (message[1] == "end") {
            try {
                bot.chat("我~不打扰，我~先走了")
                bot.removeListener('chat', botBegin)
            } catch (e) {
                return
            }
        }
    }
})

async function botBegin(username, message) {
    if (username == bot_name) return
    message = message.split(' ')
    switch (message[0]) {
        case 'go':
            botGo(message)
            break
        case 'tp':
            botTP(message)
            break
        case 'help':
            botHelp(username)
            break
        case 'time':
            bot.chat(`已运行${get_run_time()}秒`)
            break
        case 'mine':
            botMine(message)
            break
        case 'list':
            getList(bot.inventory.items())
            break
        case 'chest':
            botChest(message)
            break
        case 'notdig':
            bot.canDigBlock(false)
            movement = new pathfinder.Movements(bot, bot.registry)
            movement.canDig = false
            bot.pathfinder.setMovements(movement)
            bot.chat("OK")
            break
        case 'candig':
            bot.canDigBlock(true)
            movement = new pathfinder.Movements(bot, bot.registry)
            movement.canDig = true
            bot.pathfinder.setMovements(movement)
            bot.chat("OK")
            break
    }
}

function botTP() {
    bot.chat('/tpaccept')
}

async function botGo(message) {
    if (message.length >= 3) {
        player_name = message[2]
    } else {
        player_name = admin_name
    }
    player_entity = -1

    // 找到玩家
    player_entity = bot.players[player_name].entity
    if (!player_entity) {
        bot.chat("我找不到" + player_name)
        return
    }

    // 设定玩家为目标
    goal_player = new pathfinder.goals.GoalFollow(player_entity, 1)

    switch (message[1]) {
        case "follow":
            // 跟随玩家
            bot.pathfinder.setGoal(goal_player, true)
            break;
        case "stop":
            // 停止移动
            bot.stopDigging()
            bot.pathfinder.stop()
            break
        case "block":
            // 移动到指定方块
            if (message.length <= 4) {
                bot.chat("输入有误，请重新输入")
                return
            }
            x = parseInt(message[2])
            y = parseInt(message[3])
            z = parseInt(message[4])
            const goal_block = new pathfinder.goals.GoalBlock(x, y, z)
            try {
                bot.pathfinder.setGoal(goal_block)
            } catch (e) {
                console.log(e[0])
                bot.chat("出现问题，请重新输入")
                return
            }
            break
        default:
            // 移动到玩家所在的位置
            bot.pathfinder.setGoal(goal_player, false)
    }
}

async function botMine() {

    // 初始化
    blocks = bot.findBlocks({
        matching: bot.registry.blocksByName[goal_block].id,
        maxDistance: 90,
        count: 40
    })
    console.log(blocks)

    // 剔除和岩浆相邻的方块
    const filter = e => no_lava(e)
    blocks = blocks.filter(filter)


    while (1) {
        if (blocks.length == 0) {
            // bot.chat("我找不到" + goal_name)
            console.log("我找不到" + goal_name)
            try {
                pos = bot.entity.position.offset(30, 0, 0)
                new_area_goal = new pathfinder.goals.GoalLookAtBlock(pos, bot.world)
                await bot.pathfinder.goto(new_area_goal)
                continue
            } catch {
                continue
            }
        }

        // 遍历整个数组，挖掘对应矿石
        for (i = 0; i < blocks.length; i++) {
            block = bot.world.getBlock(blocks.shift())
            if (!block) continue
                // bot.chat(`${block.position.distanceTo(bot.entity.position)}`)

            goal = new pathfinder.goals.GoalGetToBlock(block.position.x, block.position.y, block.position.z)
            try {
                // 挖掘对应矿石
                await bot.pathfinder.goto(goal)
                await bot.tool.equipForBlock(block)
                await bot.dig(block)
                await bot.pathfinder.goto(goal)
                blocks = bot.findBlocks({
                    matching: bot.registry.blocksByName[goal_block].id,
                    maxDistance: 90,
                    count: 40
                })

                // 背包接近满员时开始丢弃杂物
                if (bot.inventory.items().length >= 30) {
                    dropThings()
                }

                // 剔除和岩浆相邻的部分
                blocks = blocks.filter(filter)
            } catch (e) {
                // bot.chat("出现问题  尝试解决ing")
                bot.stopDigging()
                    // bot.pathfinder.stop()
                console.log(e)
                continue
            }
        }
    }
}

function getList(items) {
    if (items.length == 0) {
        bot.chat("空")
        return
    }
    answer = ""
    len = 0
    for (var item of items) {
        if (item.name.indexOf(goal_item) !== -1 && item.name.indexOf("pickaxe") === -1) {
            len = len + 1
            answer = answer + `${ item.name } * ${ item.count } `
        }
    }
    bot.chat(answer)
    bot.chat(`${goal_item}总占用${len}格`)
    bot.chat(`背包总占用${bot.inventory.items().length}格`)
}

async function botChest() {
    // 找到箱子
    chestToOpen = bot.findBlock({
        matching: bot.registry.blocksByName['chest'].id,
        maxDistance: 6
    })
    if (!chestToOpen) {
        bot.chat("找不到箱子")
        return
    }

    // 打开箱子
    const chest = await bot.openChest(chestToOpen)
    getList(chest.containerItems())

    bot.on('chat', workWithChest);
    async function workWithChest(username, message) {
        if (username == bot.username) return
        message = message.split(' ')

        // 关闭箱子
        if (message[0] == "close") {
            chest.close()
            bot.removeListener('chat', workWithChest)
            return
        }
        // 展示物品
        if (message[0] == "show") {
            getList(chest.containerItems())
        }
        // 根据指令进行交互 in/out [item_name] [item_count]
        if (message.length == 1) return
        if (message[0] == "all") {
            const items = bot.inventory.items()
            if (items.length == 0) return
            if (message[1] == "in") {
                for (const item of items) {
                    await chest.deposit(item.type, null, item.count)
                }
                bot.chat("已放入所有物品")
                return
            } else if (message[1] == "out") {
                for (item of items) {
                    await chest.withdraw(item.type, null, item.count)
                }
                bot.chat("已取出所有物品")
                return
            }
        }
        item_name = message[1]
        item_count = parseInt(message[2])
        try {
            item_id = bot.registry.itemsByName[item_name].id
        } catch (e) {
            bot.chat(`找不到${item_name}`)
            return
        }

        // 放入物品
        if (message[0] == "in") {
            await chest.deposit(item_id, null, item_count)
            bot.chat(`OK 已存入${item_count}个${item_name}`)
        }
        // 取出物品
        if (message[0] == "out") {
            await chest.withdraw(item_id, null, item_count)
            bot.chat(`OK 已取出${item_count}个${item_name}`)
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

            // 圆石 -> 留一部分垫脚用
            if (item.name == 'cobblestone' && item.count == 64) {
                await bot.tossStack(bot.inventory.slots[item.slot])
            }
            // 杂牌石头
            if (item.name == 'stone') {
                await bot.tossStack(bot.inventory.slots[item.slot])
            }
            // 地狱岩 + 玄武岩
            if (item.name == 'netherrack') {
                await bot.tossStack(bot.inventory.slots[item.slot])
            }
            if (item.name == 'basalt') {
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
            // 逐个检索是否是工具比较麻烦，而且一般其他矿物不会只挖到1个，
            // 这里改成==1比较简洁而且也能起到较好的效果
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

D1 = new Date()

function get_run_time() {
    // 获取运行时间
    var D2 = (new Date).getTime()
    return (D2 - D1) / 1000
}

bot.once('spawn', () => {
    bot.autoEat.options = {
        priority: "saturation",
        startAt: 14,
    }
})

bot.on('health', () => {
    if (bot.food >= 18) {
        bot.autoEat.disable()
        console.log('Bot 吃东西结束')
    } else {
        bot.autoEat.enable()
        console.log('Bot 开始吃东西')
    }
})

function botHelp(username) {
    var msg = []
    msg.push("支持以下指令：\n")
    msg.push("1 go follow [player]跟随玩家\n")
    msg.push("2 tp 机器人输入/tpaccept，支持tpa和tpahere指令\n")
    msg.push("3 help 显示帮助\n")
    msg.push("4 time 显示运行时间\n")
    msg.push("5 mine 默认下界合金矿 可在goal_block处更改\n")
    msg.push("6 list 显示bot背包内的物品\n")
    msg.push("7 chest 对箱子进行交互，一般来说打开箱子后使用all in和close指令即可\n")
    msg.push("8 nodig 保证bot不挖掘方块 一般在使用go的时候使用\n")
    msg.push("9 candig 恢复bot挖方块的功能\n")
    msg.push("Over")

    for (item of msg) {
        bot.chat(`/tell ${username} ${item}`)
        console.log(item)
    }
}
