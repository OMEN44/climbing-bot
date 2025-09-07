import {
    Client,
    Collection,
    Events,
    GatewayIntentBits,
    MessageFlags,
    SlashCommandBuilder,
    TextChannel,
} from "discord.js";
import { deepObjectDiff } from "./objectDiff";
import {
    BranchData,
    fetchLocationData,
    formatData,
    getCapacityData,
    getNewResets,
} from "./urbanClimb";
import token from "../token.json";

console.log("Starting application...");

type ClientExt = Client & { commands: Collection<string, any> };

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

// const INTERVAL_TIME_MS = 5 * 60 * 1000; // 5 minutes
// const INTERVAL_TIME_MS = 5 * 1000; // 5 seconds
const INTERVAL_TIME_MS = 60 * 60 * 1000; // 1 hour
// const INTERVAL_TIME_MS = 24 * 60 * 60 * 1000; // 1 day
const DISCORD_CHANNEL_ID = "1411522061486129336";
const DISCORD_MENTION_ID = "<@&1411522231678406688>"; // the & is for a role

let urbanClimbData: BranchData | null = null;

const app = async () => {
    const nameIdMap: Record<string, string> = (await fetchLocationData()).props
        .pageProps.branches;

    console.log(nameIdMap);

    discordClient.on(Events.MessageCreate, async (message) => {
        if (message.author.bot) return;
        if (message.content === "ping") message.channel.send("pong");
        else if (
            message.mentions.users.keys().next().value ===
            discordClient.user!.id
        ) {
            const minMessage = message.content
                .replaceAll(" ", "")
                .toLocaleLowerCase()
                .trim();
            let messageContent = "";
            const includeAll = minMessage === `<@${discordClient.user!.id}>`;
            for (const name of Object.keys(nameIdMap)) {
                if (minMessage.includes(name) || includeAll) {
                    const branchId = nameIdMap[name];
                    messageContent += `## ${name}:\n`;
                    const capacity = await getCapacityData(branchId);
                    messageContent += `${capacity.status} with ${capacity.currently_at_venue} climbers (capacity ${capacity.current_percentage})\n`;
                }
            }
            if (messageContent !== "") message.channel.send(messageContent);
        }
    });

    await discordClient.login(token.token);

    urbanClimbData = await formatData();
    const channel = await discordClient.channels.cache.get(DISCORD_CHANNEL_ID);

    // (channel! as TextChannel).send("Larry has started...");

    //    console.log(JSON.stringify(urbanClimbData, null, 2));

    // const miltonId = "690326f9-98ce-4249-bd91-53a0676a137b";
    // urbanClimbData[miltonId].resets = urbanClimbData[miltonId].resets.filter(
    //     (reset) => {
    //         return reset.wallName === "Zepplin";
    //     }
    // );
    // urbanClimbData[miltonId].alerts = urbanClimbData[miltonId].alerts.filter(
    //     (alert) => {
    //         return alert.name !== "Sensory Mornings ";
    //     }
    // );

    setInterval(async () => {
        const newData = await formatData();

        const diff = getNewResets(urbanClimbData!, newData);

        if (diff) {
            // TODO: do something with the diff

            if (channel && channel.isTextBased() && channel.isSendable()) {
                // build message
                let message = `||${DISCORD_MENTION_ID}|| \n# Urban Climb Updates\n`;
                Object.keys(diff).forEach((branchId) => {
                    message += `## ${diff[branchId].name}:\n`;
                    if (diff[branchId].alerts.length > 0) {
                        diff[branchId].alerts.forEach((alert) => {
                            message += `**${alert.name}**${
                                alert.start
                                    ? ` *${alert.start.toDateString()}${
                                          alert.end
                                              ? ` - ${alert.end.toDateString()}*`
                                              : "*"
                                      }`
                                    : ""
                            }\n${alert.description}`;
                        });
                    }
                    if (diff[branchId].resets.length > 0) {
                        message += `### New Resets:\n`;
                        diff[branchId].resets.forEach((reset) => {
                            message += ` - ${
                                reset.wallName
                            } on ${reset.date.toDateString()}\n`;
                        });
                    }
                });
                channel.send(message);
            }
            urbanClimbData = newData;
        }
    }, INTERVAL_TIME_MS);
};

app();
