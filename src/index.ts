import { Client, Events, GatewayIntentBits } from "discord.js";
import { ClientExt } from "./core/types";
import { app } from "./core/app";
import token from "../token.json";

const discordClient = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
    ],
}) as ClientExt;

discordClient.once(Events.ClientReady, (c) => {
    console.log(`Discord client ready! Logged in as ${c.user.tag}`);
});

app(discordClient, token.token);
