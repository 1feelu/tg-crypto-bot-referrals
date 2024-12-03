const { Markup } = require('telegraf')

module.exports = ctx => {
	ctx.reply(
		'Меню',
		Markup.inlineKeyboard([
			[Markup.button.callback('🖇️Реферальная система', 'ref_system')],
			[Markup.button.callback('👤Мой аккаунт', 'my_account')],
			[Markup.button.url('🛠️Тех.поддержка', 'https://t.me/')],
		])
	)
}
