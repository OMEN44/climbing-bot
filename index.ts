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
import { BranchData, formatData, getNewResets } from "./urbanClimb";
import token from "./token.json";

console.log("Starting application...");

type ClientExt = Client & { commands: Collection<string, any> };

const discordClient = new Client({
    intents: [GatewayIntentBits.Guilds],
}) as ClientExt;

discordClient.once(Events.ClientReady, (c) => {
    console.log(`Discord client ready! Logged in as ${c.user.tag}`);
});

// const command = {
//     data: new SlashCommandBuilder()
//         .setName("user")
//         .setDescription("Provides information about the user."),
//     async execute(interaction) {
//         // interaction.user is the object representing the User who ran the command
//         // interaction.member is the GuildMember object, which represents the user in the specific guild
//         await interaction.reply(
//             `This command was run by ${interaction.user.username}, who joined on ${interaction.member.joinedAt}.`
//         );
//     },
// };

// discordClient.commands = new Collection();
// discordClient.commands.set(command.data.name, command);

// discordClient.on(Events.InteractionCreate, async (interaction) => {
//     if (!interaction.isChannelSelectMenu()) return;

//     const command = (interaction.client as ClientExt).commands.get(
//         interaction.commandName
//     );

//     if (!command) {
//         console.error(
//             `No command matching ${interaction.commandName} was found.`
//         );
//         return;
//     }

//     try {
//         await command.execute(interaction);
//     } catch (error) {
//         console.error(
//             `Error executing command ${interaction.commandName}:`,
//             error
//         );
//     }
// });

// const INTERVAL_TIME_MS = 5 * 60 * 1000; // 5 minutes
// const INTERVAL_TIME_MS = 5 * 1000; // 5 seconds
const INTERVAL_TIME_MS = 60 * 60 * 1000; // 1 hour
// const INTERVAL_TIME_MS = 24 * 60 * 60 * 1000; // 1 day
const DISCORD_CHANNEL_ID = "1411522061486129336";
const DISCORD_MENTION_ID = "<@&1411522231678406688>"; // the & is for a role

let urbanClimbData: BranchData | null = null;

const app = async () => {
    console.log(token.token);
    await discordClient.login(token.token);

    urbanClimbData = await formatData();
    const channel = await discordClient.channels.cache.get(DISCORD_CHANNEL_ID);

    (channel! as TextChannel).send("Larry has started...");

    //    console.log(JSON.stringify(urbanClimbData, null, 2));

    const miltonId = "690326f9-98ce-4249-bd91-53a0676a137b";
    urbanClimbData[miltonId].resets = urbanClimbData[miltonId].resets.filter(
        (reset) => {
            return reset.wallName === "Zepplin";
        }
    );
    urbanClimbData[miltonId].alerts = urbanClimbData[miltonId].alerts.filter(
        (alert) => {
            return alert.name !== "Sensory Mornings ";
        }
    );

    setInterval(async () => {
        const newData = await formatData();

        const diff = getNewResets(urbanClimbData!, newData);

        (channel! as TextChannel).send(JSON.stringify(diff, null, 2));

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
