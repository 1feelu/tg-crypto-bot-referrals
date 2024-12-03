const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
	userId: { type: Number, required: true, unique: true },
	username: { type: String, required: [true, 'Username is required'] },
	balance: { type: Number, default: 0 },
	referrals: { type: Number, default: 0 },
	referrerId: { type: Number, default: null },
})

userSchema.index({ userId: 1 })
userSchema.index({ referrerId: 1 })

userSchema.virtual('formattedBalance').get(function () {
	return this.balance.toFixed(2)
})

userSchema.methods.addReferral = function () {
	this.referrals += 1
	return this.save()
}

userSchema.methods.updateBalance = function (amount) {
	this.balance += amount
	return this.save()
}

module.exports = mongoose.model('User', userSchema)
