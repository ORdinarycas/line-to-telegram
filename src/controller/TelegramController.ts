import {NextFunction, Request, Response} from "express";
import { Telegraf } from 'telegraf'
require('dotenv').config();

export class TelegramController {
    async webhook(req: Request, res: Response, next: NextFunction) {
        console.log(req.body);

        // replace the value below with the Telegram token you receive from @BotFather
        const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const APP_URL = process.env.APP_URL;
        const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

        if (TELEGRAM_BOT_TOKEN === undefined) {
            throw new Error('BOT_TOKEN must be provided!')
        }
        
        if(req.body.constructor === Object && Object.keys(req.body).length === 0) {
            await bot.telegram.setWebhook(`${APP_URL}/tg/webhook`);
        }
        await bot.on('message', async(ctx) => {
            await ctx.telegram.sendCopy(ctx.message.chat.id, ctx.message)
        })
        await bot.launch()
        res.status(200).json({status: 'success'});
    }
}