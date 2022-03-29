import {getRepository} from "typeorm";
import {LineGroup} from "../entity/LineGroup";
import {LineUserProfile} from "../entity/LineUserProfile";
import {ClientConfig, Client, middleware, MiddlewareConfig, WebhookEvent, TextMessage, MessageAPIResponseBase} from '@line/bot-sdk';
import {NextFunction, Request, Response} from "express";
import {Telegraf} from 'telegraf'
require('dotenv').config();

export class LineController {
    private lineGroupRepository = getRepository(LineGroup);
    private lineUserProfile = getRepository(LineUserProfile);
    async webhook(req: Request, res: Response, next: NextFunction) {
        const events: WebhookEvent[] = req.body.events;
        console.log(JSON.stringify(req.body));

        // Setup all LINE client and Express configurations.
        const clientConfig: ClientConfig = {
            channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || '',
            channelSecret: process.env.CHANNEL_SECRET,
        };

        const middlewareConfig: MiddlewareConfig = {
            channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
            channelSecret: process.env.CHANNEL_SECRET || '',
        };

        middleware(middlewareConfig);

        // Create a new LINE SDK client.
        const client = new Client(clientConfig);
        
        // Function handler to receive the text.
        const textEventHandler = async (event: WebhookEvent): Promise<MessageAPIResponseBase | undefined> => {
            // Process all variables here.
            if (event.type !== 'message' || event.message.type !== 'text') {
                return;
            }

            // Process all message related variables here.
            const { replyToken } = event;
            const { text } = event.message;

            // Create a new message.
            const response: TextMessage = {
                type: 'text',
                text:"傳送成功",
            };

            // Reply to the user.
            await client.replyMessage(replyToken, response);
        };

        const joinEventHandler = async (event: WebhookEvent): Promise<MessageAPIResponseBase | undefined> => {
            if (event.type !== 'join' || event.source.type !== 'group') {
                return;
            }

            let groupId:string =event.source.groupId;
            await client.getGroupSummary(groupId).then((summary) => {
                this.lineGroupRepository.save({
                    id:summary.groupId,
                    name:summary.groupName,
                    picture_url:summary.pictureUrl
                })
            })
        }

        
        // Function handler to receive the text.
        const textEventHandlerToTelegram = async (event: WebhookEvent): Promise<MessageAPIResponseBase | undefined> => {
            if (event.type !== 'message' || event.message.type !== 'text') {
                return;
            }
            // replace the value below with the Telegram token you receive from @BotFather
            const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
            if (TELEGRAM_BOT_TOKEN === undefined) {
                throw new Error('BOT_TOKEN must be provided!')
            }
            const bot = new Telegraf(TELEGRAM_BOT_TOKEN);
            let messageText:string = event.message.text;
            if(event.source.type === 'user'){
                await client.getProfile(event.source.userId).then((profile)=>{
                    this.lineUserProfile.findOneOrFail(profile.userId)
                    .then((result)=>true)
                    .catch((result)=>{
                        this.lineUserProfile.save({
                            id:profile.userId,
                            display_name:profile.displayName,
                            picture_url:profile.pictureUrl,
                            status_message:profile.statusMessage,
                            language:profile.language,
                            add_source:'user'
                        })
                        .then((e)=>console.log(e))
                        .catch((e)=>console.log(e))
                    })
                })
                .catch((err)=>console.log(err));

                let lineUserName = await this.lineUserProfile.findOne(event.source.userId)
                .then((result)=>result.display_name)
                .catch((result)=>"$Undefined Group Name");
                await bot.telegram.sendMessage(229607264, `${event.source.userId}\n\n@${lineUserName}：${messageText}`)
            } else {
                let eventLessSource = {
                    type: 'group',
                    groupId: '',
                    userId: ''
                }
                eventLessSource = JSON.parse(JSON.stringify(event.source));

                await client.getProfile(eventLessSource.userId).then((profile)=>{
                    this.lineUserProfile.findOneOrFail(profile.userId)
                    .then((result)=>true)
                    .catch((result)=>{
                        this.lineUserProfile.save({
                            id:profile.userId,
                            display_name:profile.displayName,
                            picture_url:profile.pictureUrl,
                            status_message:profile.statusMessage,
                            language:profile.language,
                            add_source:'group'
                        })
                        .then((e)=>console.log(e))
                        .catch((e)=>console.log(e))
                    })
                })
                .catch((err)=>console.log(err));

                await client.getGroupMemberProfile(eventLessSource.groupId, eventLessSource.userId).then((profile)=>{
                    console.log(JSON.stringify(profile))
                    this.lineUserProfile.findOneOrFail(profile.userId)
                    .then((result)=>console.log(result))
                    .catch((result)=>{
                        console.log("-catch--")
                        console.log(result)
                        this.lineUserProfile.save({
                            id:profile.userId,
                            display_name:profile.displayName,
                            picture_url:profile.pictureUrl,
                            add_source:'group',
                            status_message:profile.statusMessage
                        })
                        .then((e)=>console.log(e))
                        .catch((e)=>console.log(e))
                    })
                })
                .catch((err)=>console.log(err));

                let lineGroupName = await this.lineGroupRepository.findOne(eventLessSource.groupId)
                    .then((result)=>result.name)
                    .catch((result)=>"$Undefined Group Name");
                let lineUserName = await this.lineUserProfile.findOne(eventLessSource.userId)
                .then((result)=>result.display_name)
                .catch((result)=>"$Undefined User Name");
                await bot.telegram.sendMessage(229607264, `${eventLessSource.groupId}\nLINE群組：${lineGroupName}\n\n@${lineUserName}：${messageText}`)
                
            }
            await bot.launch()
            await bot.stop('SIGINT')
            await bot.stop('SIGTERM')
        };

        // Process all of the received events asynchronously.
        const results = await Promise.all(
            events.map(async (event: WebhookEvent) => {
                try {
                    await joinEventHandler(event)
                    await textEventHandlerToTelegram(event);
                } catch (err) {
                    if (err instanceof Error) {
                        console.error(err);
                    }
                    // Return an error message.
                    return res.status(500).json({
                        status: 'error',
                    });
                }
            })
        );

        res.status(200).json({
            status: 'success',
            results,
        });
    }

}