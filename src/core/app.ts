import { Events } from "discord.js";
import {
    fetchLocationData,
    formatData,
    getCapacityData,
    getNewResets,
    BranchData,
} from "./urbanClimbInterface";
import type { ClientExt } from "./types";
import { newSetReminder } from "../commands/todaysSets";

// const INTERVAL_TIME_MS = 5 * 60 * 1000; // 5 minutes
// const INTERVAL_TIME_MS = 5 * 1000; // 5 seconds
const INTERVAL_TIME_MS = 60 * 60 * 1000; // 1 hour
// const INTERVAL_TIME_MS = 24 * 60 * 60 * 1000; // 1 day
const DISCORD_CHANNEL_ID = "1411522061486129336";
const DISCORD_MENTION_ID = "<@&1411522231678406688>"; // the & is for a role

let urbanClimbData: BranchData | null = null;

export const app = async (dClient: ClientExt, token: string) => {
    const nameIdMap: Record<string, string> = (await fetchLocationData()).props
        .pageProps.branches;

    console.log(nameIdMap);

    dClient.on(Events.MessageCreate, async (message) => {
        if (message.author.bot) return;
        if (message.content === "ping") message.channel.send("pong");
        else if (
            message.mentions.users.keys().next().value === dClient.user!.id
        ) {
            const minMessage = message.content
                .replaceAll(" ", "")
                .toLocaleLowerCase()
                .trim();
            let messageContent = "";
            const includeAll = minMessage === `<@${dClient.user!.id}>`;
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

    await dClient.login(token);

    urbanClimbData = await formatData();
    const channel = await dClient.channels.cache.get(DISCORD_CHANNEL_ID);

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

    if (channel && channel.isTextBased() && channel.isSendable()) {
        newSetReminder(channel, urbanClimbData);
    }
};
