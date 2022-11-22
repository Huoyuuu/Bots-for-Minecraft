const mineflayer = require('mineflayer')
const bot = mineflayer.createBot({
    username: "first_bot"
})
bot.once('spawn', () => {
    bot.chat('Hi')
})