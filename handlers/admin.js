require('dotenv').config()
const { Markup } = require('telegraf')
const User = require('../models/User')

const ADMIN_ID = process.env.ADMIN_ID // Убедитесь, что ADMIN_ID определен в .env

if (!ADMIN_ID) throw new Error('ADMIN_ID is not set in .env')

function isAdmin(ctx) {
	if (!ctx || !ctx.from || typeof ctx.from.id === 'undefined') {
		console.error('Ошибка: ctx или ctx.from.id не определены.', ctx)
		return false
	}
	return String(ctx.from.id) === ADMIN_ID
}

function setupAdminHandlers(bot) {
	// Админ-панель
	bot.command('admin', ctx => {
		if (!isAdmin(ctx)) {
			return ctx.reply('❌ У вас нет доступа к админ-панели.')
		}

		const buttons = Markup.inlineKeyboard([
			[Markup.button.callback('📋 Список пользователей', 'admin_users')],
			[Markup.button.callback('💸 Запросы на вывод', 'admin_withdrawals')],
			[Markup.button.callback('⚙️ Настройки', 'admin_settings')],
		])

		ctx.reply('Добро пожаловать в админ-панель!', buttons)
	})

	// Список пользователей
	bot.action('admin_users', async ctx => {
		if (!isAdmin(ctx)) {
			return ctx.answerCbQuery('❌ У вас нет доступа к админ-панели.', true)
		}

		const users = await User.find()
		if (users.length === 0) {
			return ctx.reply('📋 Пользователей не найдено.')
		}

		let response = '📋 Список пользователей:\n\n'
		users.forEach((user, index) => {
			response += `${index + 1}. ${user.username || 'Без ника'} (ID: ${
				user.userId
			})\n`
		})

		await ctx.reply(response)
		ctx.answerCbQuery()
	})

	bot.action('admin_withdrawals', ctx => {
		if (!isAdmin(ctx)) {
			return ctx.answerCbQuery('❌ У вас нет доступа к админ-панели.', true)
		}
		ctx.reply('💸 Здесь будут показаны запросы на вывод.')
		ctx.answerCbQuery()
	})

	bot.action('admin_settings', ctx => {
		if (!isAdmin(ctx)) {
			return ctx.answerCbQuery('❌ У вас нет доступа к админ-панели.', true)
		}
		ctx.reply('⚙️ Здесь можно будет менять настройки бота.')
		ctx.answerCbQuery()
	})
}

async function listUsers(ctx) {
	if (!isAdmin(ctx)) {
		return ctx.reply('❌ У вас нет доступа к админ-панели.')
	}

	const users = await User.find()
	if (users.length === 0) {
		return ctx.reply('📋 Пользователей не найдено.')
	}

	let response = '📋 Список пользователей:\n\n'
	users.forEach((user, index) => {
		response += `${index + 1}. ${user.username || 'Без ника'} (ID: ${
			user.userId
		})\n`
	})

	ctx.reply(response)
}

async function manageBalance(ctx) {
	if (!isAdmin(ctx)) {
		return ctx.reply('❌ У вас нет доступа к админ-панели.')
	}

	const message = `Введите ID пользователя и сумму изменения через пробел.\nПример: \`12345678 50\` (прибавит 50 LIR)\nПример: \`12345678 -20\` (убавит 20 LIR)`
	return ctx.replyWithMarkdown(message)
}

async function updateBalance(ctx) {
	if (!isAdmin(ctx)) return

	const input = ctx.message.text.split(' ')
	if (input.length !== 2) {
		return ctx.reply('❌ Неверный формат. Укажите ID и сумму через пробел.')
	}

	const [userId, amount] = input
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
}

async function massMessage(ctx) {
	if (!isAdmin(ctx)) {
		return ctx.reply('❌ У вас нет доступа к админ-панели.')
	}

	const message = ctx.message.text.replace('/mass ', '').trim()
	if (!message) {
		return ctx.reply(
			'❌ Укажите текст для рассылки. Например:\n`/mass Текст сообщения`'
		)
	}

	const users = await User.find()

	let sent = 0
	let failed = 0

	for (const user of users) {
		try {
			await ctx.telegram.sendMessage(user.userId, message)
			sent++
			await new Promise(res => setTimeout(res, 50)) // Задержка
		} catch (error) {
			failed++
			console.error(
				`Ошибка отправки пользователю ${user.userId}:`,
				error.response?.description || error.message
			)
		}
	}

	return ctx.reply(
		`✅ Рассылка завершена.\nОтправлено: ${sent}\nНе удалось отправить: ${failed}`
	)
}

module.exports = {
	setupAdminHandlers,
	isAdmin,
	manageBalance,
	updateBalance,
	massMessage,
}
