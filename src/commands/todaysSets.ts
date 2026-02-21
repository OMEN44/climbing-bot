import {
    DMChannel,
    Message,
    NewsChannel,
    OmitPartialGroupDMChannel,
    PartialDMChannel,
    PrivateThreadChannel,
    PublicThreadChannel,
    StageChannel,
    TextChannel,
    VoiceChannel,
} from "discord.js";
import { BranchData } from "../core/urbanClimbInterface";

const HOUR = 9;
const MINUTE = 0;

type Channel =
    | DMChannel
    | PartialDMChannel
    | NewsChannel
    | StageChannel
    | TextChannel
    | PublicThreadChannel<boolean>
    | PrivateThreadChannel
    | VoiceChannel;

export const sendTodaysSets = (
    forceMessage: boolean,
    urbanClimbData: BranchData,
    channel: Channel,
    message?: OmitPartialGroupDMChannel<Message>,
    locationName?: string,
) => {
    let messageContent = "# Today's new sets:\n";
    const now = new Date();

    for (const [id, location] of Object.entries(urbanClimbData)) {
        let resetsContent = "";
        location.resets.forEach((reset) => {
            if (isSameDay(now, reset.date)) {
                resetsContent += ` - ${reset.wallName}\n`;
            }
        });
        if (resetsContent !== "") {
            messageContent += `## ${location.name}:\n${resetsContent}`;
        }
    }

    if (forceMessage && messageContent === "# Today's new sets:\n") {
        messageContent += "No new sets today!";
        channel.send(messageContent);
    } else if (messageContent !== "# Today's new sets:\n") {
        channel.send(messageContent);
    }
};

export const newSetReminder = (
    channel: Channel,
    urbanClimbData: BranchData,
) => {
    setInterval(() => {
        const now = new Date();
        if (now.getHours() === HOUR && now.getMinutes() === MINUTE) {
            sendTodaysSets(false, urbanClimbData!, channel);
        }
    }, 1000 * 60); // check every minute
};

const isSameDay = (date1: Date, date2: Date) => {
    return (
        date1.getDate() === date2.getDate() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear()
    );
};
