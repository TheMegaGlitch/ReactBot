const Discord = require('discord.js')
module.exports = {
	name: 'invite',
	description: 'Get an invite for this bot.',
	usage: '',
	async execute(message = new Discord.Message(), args = new Array(), client = new Discord.Client()) {
		const inviteEmbed = new Discord.MessageEmbed()
        .setDescription(`Here's my [invite link](https://discord.com/api/oauth2/authorize?client_id=757493290248699904&permissions=268774464&scope=bot)!`)
        return message.channel.send(inviteEmbed)
	},
};