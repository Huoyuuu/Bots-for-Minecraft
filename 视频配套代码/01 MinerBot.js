// 通过聊天进行交互
// 期望实现的功能：
// go        自动寻路到指定的位置
// start     [宽] [高] [矿道长度] 自动挖掘人工矿道
// stop      停止挖矿
// storage   将物品存入最近的箱子中

// 预留功能：怎样实现丰字形矿道？

const admin_name = ""
const mineflayer = require('mineflayer')
const pathfinder = require('mineflayer-pathfinder')
const bot = mineflayer.createBot({
    username: "miner_bot",
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

// 预留问题
// 0 if语句和switch语句起什么作用？如果未接触过编程可以考虑在这里补充相关语法知识：<https://www.runoob.com/js/js-tutorial.html>
// 1 机器人是通过什么语句找到玩家的？怎么知道有bot.players[]这么个内容？具体又怎么知道它的用法呢？
// 2 既然能找到玩家，那么能否能找到特定方块呢？比如找到附近的钻石矿石？
// 3 尝试实现功能 go follow [玩家名] 让bot跟随指定玩家
// 4 代码中的实现是否和你预想的实现方式相符？有无更好写法？比如能否优化与bot之间的交互方式？
// 遇到问题或者有想法建议都欢迎在评论区补充、在QQ群<528497821>内交流、或在github<https://github.com/Huoyuuu/Bots-for-Minecraft>上提交pr修改

// 此外，问题1实际上就是API接口的问题，简单使用可以代码补全功能简单理解，具体用法就需要查看API文档了，参看<https://github.com/PrismarineJS/mineflayer/blob/master/docs/api.md>
// 不过坦白地说，Mineflayer的tutorial文档写得很棒，但是API文档不尽如人意，这部分更推荐问Q群群友或者结合mineflayer/examples文件夹下的示例内容理解学习
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