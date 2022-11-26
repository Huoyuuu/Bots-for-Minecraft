const mineflayer = require('mineflayer')
const bot = mineflayer.createBot({
    username: "first_bot",
    port: 4463
})

function sayHello() {
    bot.chat('Hi')
}
bot.once('spawn', sayHello)

bot.once('spawn', () => { bot.chat('Hi') })