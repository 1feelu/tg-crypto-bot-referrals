const { Markup } = require('telegraf')
const User = require('../models/User')

module.exports = async ctx => {
	const userId = ctx.from.id
	const username = ctx.from.username || 'Без ника'
	const referrerId = ctx.payload ? Number(ctx.payload) : null

	let user = await User.findOne({ userId })

	if (!user) {
		user = new User({ userId, username, referrerId })
		await user.save()

		if (referrerId) {
			const referrer = await User.findOne({ userId: referrerId })
			if (referrer) {
				referrer.balance += 8
				referrer.referrals += 1
				await referrer.save()
			}
		}
	}

	const buttons = Markup.inlineKeyboard([
		[Markup.button.callback('🖇️Реферальная система', 'ref_system')],
		[Markup.button.callback('👤Мой аккаунт', 'my_account')],
		[Markup.button.url('🛠️Тех.поддержка', 'https://t.me/')],
	])

	ctx.reply('Приветственное сообщение (замените этот текст)', buttons)
}
