const Discord = require('discord.js')
const config = require('../config.json')
const Keyv = require("keyv")
const reactbotViewRole = new Keyv(`sqlite://./roles.sqlite`);
const reactbotMessages = new Keyv(`sqlite://./messages.sqlite`);
const reactbotReactions = new Keyv(`sqlite://./reactions.sqlite`);
module.exports = {
	name: 'setup',
	description: 'Setup a message to wait for a reaction.',
	manageGuild:true,
	async execute(message = new Discord.Message(), args = new Array(), client = new Discord.Client()) {
		message.channel.send(`<@!${message.author.id}>: Are you sure you're ready to run the setup process?`).then((confirmationMessage) => {
			confirmationMessage.react('✅').then(() => confirmationMessage.react('❌'));

			const reactionFilter = (reaction, user) => {
				return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
			};

			confirmationMessage.awaitReactions(reactionFilter, { max: 1, time: 3000000, errors: ['time'] })
				.then(collected => {
					const reaction = collected.first();

					if (reaction.emoji.name === '✅') {
						//ROLE_SETUP
						message.channel.send(`<@!${message.author.id}>: Setup started.`, {allowedMentions:{users:[client.user.id]}})
						message.channel.send(`<@!${message.author.id}>: Please mention or provide the ID for the role you want to be given/removed.`, {allowedMentions:{users:[client.user.id]}})
						const messageFilter = (response = new Discord.Message()) => {
							return response.author.id === message.author.id
						};
							message.channel.awaitMessages(messageFilter, { max: 1, time: 300000, errors: ['time'] })
								.then((collected) => {
									let reactbotRoleID = collected.first().mentions.roles.first() && collected.first().mentions.roles.first().id || collected.first().content
									collected.first().guild.roles.fetch(reactbotRoleID).then((role) => {
										if(role == undefined){
											//SETUP_ROLE_INVALID
											return message.channel.send(`⚠ <@!${message.author.id}>: The provided role mention/ID was not found. Please re-run the command to try again. If it continues to fail, please contact the bot developer. [ERR: SETUP_ROLE_INVALID]`, {allowedMentions:{users:[client.user.id]}})
										}else{
											if(message.guild.me.roles.highest.position <= role.position){
												//SETUP_ROLE_INVALID_HIGHER
												return message.channel.send(`⚠ <@!${message.author.id}>: The provided role mention/ID is higher than or equal to the bot's role. The role must be below the bot's highest role to be able to assign it. Please re-run the command to try again. If it continues to fail, please contact the bot developer. [ERR: SETUP_ROLE_INVALID_HIGHER]`, {allowedMentions:{users:[client.user.id]}}) 
											}
											reactbotViewRole.set(message.guild.id, role.id).then((savedCheck) => {
												//SETUP_ROLE_SETUP_SAVE_CHECK
												if(savedCheck == false){
													return message.channel.send(`⚠ <@!${message.author.id}>: Something went wrong while saving the role data. This shouldn't happen. Please contact the bot developer. [ERR: SETUP_ROLE_SETUP_SAVE_CHECK]`, {allowedMentions:{users:[client.user.id]}})
												}
												reactbotViewRole.get(message.guild.id).then(roleID => {
													message.channel.send(`<@!${message.author.id}>: Please mention or provide the ID for the channel you want to wait for reaction in.`, {allowedMentions:{users:[client.user.id]}})
													const messageFilter = (response = new Discord.Message()) => {
														return response.author.id === message.author.id
													};
														message.channel.awaitMessages(messageFilter, { max: 1, time: 300000, errors: ['time'] })
															.then((collected) => {
																let awaitReactionChannel = collected.first().mentions.channels.first() && collected.first().mentions.channels.first().id || collected.first().content
																if(!message.guild.channels.cache.get(awaitReactionChannel)){
																	return message.channel.send()
																}
																message.client.channels.fetch(awaitReactionChannel).then((channel = new Discord.Channel()) => {
																	if(channel == undefined){
																		//SETUP_CHANNEL_INVALID
																		return message.channel.send(`⚠ <@!${message.author.id}>: The provided channel mention/ID was not found. Please re-run the command to try again. If it continues to fail, please contact the bot developer. [ERR: SETUP_CHANNEL_INVALID]`, {allowedMentions:{users:[client.user.id]}})
																	}else{						
																		//REACTION_SETUP
																		
																		message.channel.send(`<@!${message.author.id}>: Please react to this message with the emoji you want people to select to receive/remove the role.`, {allowedMentions:{users:[client.user.id]}}).then((awaitReactionMessage) => {
																			const reactFilter = (reaction, user) => {
																				return user.id === message.author.id;
																			};
																			
																			awaitReactionMessage.awaitReactions(reactFilter, { max: 1, time: 3000000, errors: ['time'] })
																				.then(collected => {
																					let reaction = collected.first().emoji.id == null?collected.first().emoji.name:collected.first().emoji.id
																					let resolvedEmoji = client.emojis.resolve(reaction)
																					let embed = new Discord.MessageEmbed()
																					.setDescription(`React with ${resolvedEmoji?`<:${resolvedEmoji.name}:${resolvedEmoji.id}>`:reaction} to get the <@&${roleID}> role.`)
																					.setFooter(`Setup by ${message.author.tag} (${message.author.id}) | ${message.guild.name}`, message.author.displayAvatarURL({dynamic:true}))
																					channel.send(embed).then((botMessage = new Discord.Message()) => {
																							botMessage.react(reaction).then(() => {
																								reactbotReactions.set(botMessage.id,(resolvedEmoji || reaction)).then(() => {
																									reactbotMessages.set(botMessage.id, {channel:botMessage.channel.id, guild:botMessage.guild.id,message:botMessage.id, role:roleID}).then(() => {
																										return message.channel.send("✅ Setup complete.")
																									})
																								})
																							})
																					})
																				})
																				.catch(collected => {
																					console.error(collected)
																					message.channel.send(`<@!${message.author.id}>: It appears no response was given. Please re-run the command try again.`)
																				});
																		})
																	}
																})
															})
															.catch((collected = new Discord.Message()) => {
																console.error(collected)
																message.channel.send(`<@!${message.author.id}>: It appears no response was given. Please re-run the command try again.`)
															});
												})
											})
										}
									})
								})
								.catch((collected = new Discord.Message()) => {
									message.channel.send(`<@!${message.author.id}>: It appears no response was given. Please re-run the command try again.`)
								});
					} else {
						message.channel.send(`<@!${message.author.id}>: Setup process was cancelled.`, {allowedMentions:{users:[client.user.id]}})
					}
				})
				.catch(collected => {
					message.channel.send(`<@!${message.author.id}>: It appears no response was given. Please re-run the command try again.`)
				});
					})
	}
};