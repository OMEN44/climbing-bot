import { Client, Events, MessageFlags } from "discord.js";
import { Config } from "./types";
import { Branches, handleData } from "../data/urbanClimb";
import { availableCommands } from "../commands/commands";
import { cacheCleaner } from "../commands/gym";

let data: Branches | null = null;

export const app = async (dClient: Client, config: Config) => {
    // init data
    const { cleanup } = await handleData((b) => {
        data = b;
    });

    // register events
    dClient.once(Events.ClientReady, (c) => {
        console.log(`Discord client ready! Logged in as ${c.user.tag}`);
    });
    dClient.on(Events.InteractionCreate, async (interaction) => {
        if (interaction.isChatInputCommand()) {
            const command = availableCommands.find(
                (c) => c.command.name === interaction.commandName,
            );
            if (command) {
                await command.commandHandler(interaction, data!);
            }
        } else if (interaction.isButton()) {
            const [commandName] = interaction.customId.split("-");
            const command = availableCommands.find(
                (c) => c.command.name === commandName,
            );
            if (command && command.buttonHandler) {
                await command.buttonHandler(interaction, data!);
            } else {
                await interaction.reply({
                    content: "This interaction has expired.",
                    flags: MessageFlags.Ephemeral,
                });
            }
        }
    });

    // start bot
    dClient.login(config.token);
    // clean cache every 30 minutes, items expire after 2 hours
    const cleanerHandle = cacheCleaner(30, 2 * 60 * 60 * 1000);

    // cleanup on exit
    process.on("SIGINT", () => {
        console.log("Cleaning up...");
        cleanup();
        clearInterval(cleanerHandle);
        process.exit();
    });
};
