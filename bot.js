const fs = require("fs")
const Discord = require("discord.js")
const config = require("./config.json")
const client = new Discord.Client({ws:{intents:["GUILDS", "GUILD_MEMBERS", "GUILD_MESSAGE_REACTIONS", "GUILD_MESSAGES", "DIRECT_MESSAGES"]}, partials:["MESSAGE", "CHANNEL", "USER", "REACTION", "GUILD_MEMBER"]})
client.commands = new Discord.Collection()
const Keyv = require('keyv');
const reactbotMessages = new Keyv('sqlite://./messages.sqlite');
const reactbotReactions = new Keyv(`sqlite://./reactions.sqlite`);
reactbotMessages.on('error', err => console.error('Keyv connection error:', err));
client.login(config.token)

client.once("ready", () => {
    console.log("Bot started.")
	console.log(`Currently in: ${client.guilds.cache.size} ${client.guilds.cache.size == 1?"guild":"guilds"}`)
	function setStatus(){
		client.user.setActivity(`${client.guilds.cache.size} ${client.guilds.cache.size == 1?"server":"servers"} | ${config.prefix}help`)
	}
	setStatus()
    setInterval(() => {
		setStatus()
    }, 60000);
    if(!config.logChannel)
	client.channels.fetch(config.logChannel, true).then(channel => {
		let startupEmbed = new Discord.MessageEmbed()
		.setDescription(`✅ **Bot started**\nGuilds: ${client.guilds.cache.size}`)
		channel.send(startupEmbed)
	})
})

client.on("guildCreate", guild => {
    if(!config.logChannel)
	client.channels.fetch(config.logChannel, true).then(channel => {
		let joinedGuildEmbed = new Discord.MessageEmbed()
		.setDescription(`📥 **Joined Guild**\nName: ${guild.name}\nID: ${guild.id}`)
		.setColor("00FF00")
		channel.send(joinedGuildEmbed)
	})
})

client.on("guildDelete", guild => {
    if(!config.logChannel)return;
	client.channels.fetch(config.logChannel, true).then(channel => {
		let leftGuildEmbed = new Discord.MessageEmbed()
		.setDescription(`📤 **Left Guild**\nName: ${guild.name}\nID: ${guild.id}`)
		.setColor("FF0000")
		channel.send(leftGuildEmbed)
	})
})

const commandFiles = fs.readdirSync('./actions').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./actions/${file}`);
    client.commands.set(command.name, command);
    console.log(`Loaded: ${command.name}`)
}

client.on('message', async message => {
	if(message.partial == true)return;
	//Put a module called "commandHandler.js" in "modules/" to override built in command handler
	if(fs.existsSync('./modules/commandHandler.js')){
		const commandHandler = require('./commandHandler.js')
		return commandHandler.execute(message, client)
	}
	if (!message.content.startsWith(config.prefix) || message.author.bot || message.channel.type == "dm") return;
		const args = message.content.slice(config.prefix.length).split(/ +/);
		const commandName = args.shift().toLowerCase();
		const command = client.commands.get(commandName)
			|| client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
	if (!command) {
		return;
    }

	if(!message.member.hasPermission("MANAGE_GUILD") && command.manageGuild && command.manageGuild == true){
        return message.channel.send("You need to have the `MANAGE SERVER` permission to use this command.")
	}
	
	if(config.staff && !config.staff.includes(message.author.id) && command.staff && command.staff == true){
		return message.channel.send(`This command is currently restricted to Justice Devs Staff members.`)
	}

	try {
		command.execute(message, args, message.client);
	} catch (err) {
		console.error(err);
	}
});

function getUser(reaction, user, action = "none"){
	reactbotMessages.get(reaction.message.id).then(messageData => {
		console.log(messageData)
		if(messageData == undefined || messageData.message != reaction.message.id){
			return
		}else{
			reactbotReactions.get(messageData.message).then(storedReaction => {
				let requiredReaction = storedReaction.id?storedReaction.id:storedReaction
				let givenReaction = reaction.emoji.id == null?reaction.emoji.name:reaction.emoji.id
				if(requiredReaction == givenReaction){
					switch(action){
						case "addrole":{
							return reaction.message.guild.members.fetch(user).then((guildMember = new Discord.GuildMember()) => {
								return guildMember.roles.add(reaction.message.guild.roles.cache.get(messageData.role))
							})
						}
						case "removerole":{
							return reaction.message.guild.members.fetch(user).then((guildMember = new Discord.GuildMember()) => {
								return guildMember.roles.remove(reaction.message.guild.roles.cache.get(messageData.role))
							})
						}
						default:{
		
						}
					}
				}
			})
		}
	})
}

client.on("messageReactionAdd", (reaction, user) => {
	try{
		reaction.fetch().then(fetchedReaction => {
			return getUser(reaction, user, "addrole")
		})
	}catch(err){
		console.error(err)
	}
})

client.on("messageReactionRemove", (reaction, user) => {
	try{
		reaction.fetch().then(fetchedReaction => {
			return getUser(reaction, user, "removerole")
		})
	}catch(err){
		console.error(err)
	}
})

process.on("unhandledRejection", (err) => {
	console.error(err)
})