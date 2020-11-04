const Discord = require('discord.js')
function reply(title, content, foot, dest){
	let embed = new Discord.MessageEmbed()
	.setTitle(title || "")
	.setDescription(content || "")
	.setFooter(foot || "")
	dest.send(embed)
}
module.exports = {
	name: 'dev',
	description: 'Developer settings for ReactBot.',
	staff:true,
	async execute(message = new Discord.Message(), args = new Array(), client = new Discord.Client()) {
		switch((args[0] || "").toLowerCase()){
			case "guilds":{
				let guilds = []
				message.client.guilds.cache.each(guild => {
					if(guild.available == true){
						guilds.push(`${guild.name} (${guild.id})`)
					}else{
						guilds.push(`⚠ Guild unavailable ⚠ (${guild.id})`)
					}
				})
				return message.channel.send(guilds.join("\n"))
			}
			case "guildinfo":{
				let guild = message.client.guilds.cache.get(args[1])
				if(guild.available == false){
					return message.channel.send("❓ This guild is currently unavailable. Please try again later.")
				}
				if(!guild)return message.channel.send("Invalid guild.")
				return message.client.users.fetch(guild.owner.id).then(() => {
					return message.channel.send(`__${guild.name}__\nOwner tag: ${guild.owner.user.tag}\nOwner ID: ${guild.owner.id}\nMember count: ${guild.memberCount}`)
				})
			}
			case "eval":{
				function clean(text) {
					if (typeof(text) === "string")
					  return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
					else
						return text;
				  }
				if(message.author.id != require("../config.json").ownerID)
					return message.channel.send("Error! This is an owner only command.")
					try {
						const code = args.join(" ").replace(args[0], "");
						let evaled = await eval(code);
				   
						if (typeof evaled !== "string")
						  evaled = require("util").inspect(evaled);
				   
						return message.channel.send(`\`\`\`console\n${clean(evaled)}\n\`\`\``);
					  } catch (err) {
						return message.channel.send(`\`\`\`console\nERROR!\n${clean(err)}\n\`\`\``);
					  }
			}
			case "update":{
				async function updateData(result, message){
					if(result == true){
						const { exec } = require("child_process");
						return exec("git pull", (error, stdout, stderr) => {
							console.log("Pulled")
								reply("", `${stdout}\n======================\n${stderr}`, "", message.channel)
								reply("", `🔁 Restarting. Please wait a moment.`, "", message.channel)
								setTimeout(() => {
									console.log("Exited")
									process.exit()
								}, 2000);
						});  
					}else if(result == false){
						return message.channel.send("Request was cancelled.")
					}
				}
				return updateData(true, message)
			}
			default:{
				return message.channel.send(`Invalid operation.`)
			}
		}
	}
};