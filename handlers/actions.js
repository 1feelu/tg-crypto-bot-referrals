require('dotenv').config()
const { Markup } = require('telegraf')
const User = require('../models/User')

async function handleRefSystem(ctx) {
	try {
		if (!ctx.from || !ctx.from.id) {
			throw new Error('Invalid context: ctx.from.id is missing')
		}

		const userId = ctx.from.id
		const user = await User.findOne({ userId })

		if (user) {
			const referralLink = `https://t.me/${ctx.botInfo.username}?start=${userId}`
			await ctx.editMessageText(
				`За каждого приглашенного человека Вы будете получать 8 LIR (0.08 USDT). Вывод денег происходит на Qiwi, CryptoBot или любой другой способ.\n\nВаша реферальная ссылка: ${referralLink}`,
				Markup.inlineKeyboard([[Markup.button.callback('📲Меню', 'menu')]])
			)
		} else {
			await ctx.reply('Пользователь не найден.')
		}
	} catch (err) {
		console.error('Error in handleRefSystem:', err)
		await ctx.reply('Произошла ошибка при обработке запроса. Попробуйте позже.')
	}
}

async function handleMyAccount(ctx) {
	try {
		const userId = ctx.from.id
		const user = await User.findOne({ userId })

		if (user) {
			const text = `Ваш ник: ${user.username}\nВаш ID: ${userId}\nКоличество рефералов: ${user.referrals}\nВаш баланс: ${user.balance} LIR`
			const buttons = [
				user.balance < 120
					? Markup.button.callback('❌Вывод от 120 LIR', 'menu')
					: Markup.button.url(
							'💰Вывод',
							`https://t.me/${process.env.ADMIN_USERNAME}`
					  ),
				Markup.button.callback('📲Меню', 'menu'),
			]

			await ctx.editMessageText(text, Markup.inlineKeyboard(buttons))
		} else {
			await ctx.reply('Пользователь не найден.')
		}
	} catch (err) {
		console.error('Error in handleMyAccount:', err)
		await ctx.reply(
			'Произошла ошибка при обработке аккаунта. Попробуйте позже.'
		)
	}
}

module.exports = { handleRefSystem, handleMyAccount }
