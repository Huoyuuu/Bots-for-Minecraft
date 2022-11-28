// 通过聊天进行交互
// 期望实现的功能：
// go        自动寻路到指定的位置
// start     [宽] [高] [矿道长度] 自动挖掘人工矿道 -> 三重for循环
// stop      停止挖矿 -> blocks=[] bot.stopdigging() bot.pathfinder.stop()
// storage   将物品存入最近的箱子中

// 预留功能：怎样实现丰字形矿道？

const admin_name = "Huoyuuu"
const mineflayer = require('mineflayer')
const pathfinder = require('mineflayer-pathfinder')
const bot = mineflayer.createBot({
    username: "walk_bot",
    port: 1333,
})
bot.loadPlugin(pathfinder.pathfinder)

bot.on('chat', (username, message) => {
    if (username != admin_name) return
    message = message.split(' ')
    console.log(message)
    if (message[0] == "go") {
        botGo(message)
    }
})

function botGo(message) {
    // 找到玩家
    const admin_entity = bot.players[admin_name].entity

    // 设定玩家为目标
    const goal_admin = new pathfinder.goals.GoalFollow(admin_entity, 1)

    switch (message[1]) {
        case "follow":
            // 跟随玩家
            bot.pathfinder.setGoal(goal_admin, true)
            break;
        case "stop":
            // 停止移动
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
            bot.pathfinder.setGoal(goal_admin, false)
    }
}

function botStart(message) {

}