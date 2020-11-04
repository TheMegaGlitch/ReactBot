const Discord = require('discord.js')
const config = require("../config.json")
module.exports = {
	name: 'help',
	description: 'List all available commands.',
	aliases: ['commands'],
	usage: '',
	async execute(message = new Discord.Message(), args = new Array(), client = new Discord.Client()) {
		const data = [];
		const { commands } = message.client;
		const helpEmbed = new Discord.MessageEmbed()
		await commands.forEach(element => {
			const command = element
			if(message.member.hasPermission("ADMINISTRATOR") && command.admin && command.admin == true){
		        data.push(`**${command.name}**: *${command.description || 'No information available.'}*`)		
			}
			if(message.member.hasPermission("MANAGE_GUILD") && command.manageGuild && command.manageGuild == true){
		        data.push(`**${command.name}**: *${command.description || 'No information available.'}*`)		
			}
			if(config.staff && config.staff.includes(message.author.id) && command.staff && command.staff == true){
				data.push(`**${command.name}**: *${command.description || 'No information available.'}*`)
			}
			if(!command.admin && !command.staff && !command.manageGuild){
		        data.push(`**${command.name}**: *${command.description || 'No information available.'}*`)		
			}

        })
        helpEmbed.setDescription(data.join("\n"))
        return message.channel.send(helpEmbed)
	},
};