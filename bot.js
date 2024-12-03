require('dotenv').config()
const User = require('./models/User')
const { Telegraf } = require('telegraf')
const connectToDatabase = require('./utils/database')
const handleStart = require('./handlers/start')
const { handleRefSystem, handleMyAccount } = require('./handlers/actions')
const handleMenu = require('./handlers/menu')
const {
	setupAdminHandlers,
	isAdmin,
	manageBalance,
	updateBalance,
	massMessage,
} = require('./handlers/admin')

const bot = new Telegraf(process.env.BOT_TOKEN)

connectToDatabase()

setupAdminHandlers(bot)

bot.start(handleStart)
bot.action('ref_system', handleRefSystem)
bot.action('my_account', handleMyAccount)
bot.action('menu', handleMenu)

let waitingForBalanceUpdate = {}

bot.command('balance', async ctx => {
	if (!isAdmin(ctx)) {
		return ctx.reply('❌ У вас нет доступа к этой команде.')
	}

	const input = ctx.message.text.split(' ')
	if (input.length !== 3) {
		return ctx.reply(
			'❌ Укажите ID пользователя и сумму через пробел.\nПример: 12345678 50 (прибавит 50 LIR)\nПример: 12345678 -20 (убавит 20 LIR)'
		)
	}

	const [_, userId, amount] = input // `_` игнорирует саму команду `/balance`
	const numericAmount = Number(amount)

	if (isNaN(numericAmount)) {
		return ctx.reply('❌ Сумма должна быть числом.')
	}

	const user = await User.findOne({ userId })
	if (!user) {
		return ctx.reply(`❌ Пользователь с ID ${userId} не найден.`)
	}

	user.balance += numericAmount
	await user.save()

	return ctx.reply(
		`✅ Баланс пользователя ${
			user.username || 'Без ника'
		} (ID: ${userId}) успешно обновлен.\nНовый баланс: ${user.balance} LIR`
	)
})

bot.command('mass', async ctx => {
	if (!isAdmin(ctx)) {
		return ctx.reply('❌ У вас нет доступа к админ-панели.')
	}

	const text = ctx.message.text.split(' ').slice(1).join(' ')
	if (!text) {
		return ctx.reply(
			'❌ Укажите текст сообщения. Например: `/mass Привет всем!`'
		)
	}

	await massMessage(ctx)
})

bot.launch().then(() => console.log('Bot is running'))

bot.catch((err, ctx) => {
	console.error(`Error for ${ctx.updateType}:`, err)
})

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
