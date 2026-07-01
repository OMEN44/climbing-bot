import {
    ChatInputCommandInteraction,
    MessageFlags,
    SlashCommandBuilder,
} from "discord.js";
import { subscriptions } from "./gym";
import { Command } from "./commands";
import { Branches } from "../data/urbanClimb";

const COMMAND_NAME = "subscriptions";

export const viewSubscriptions: Command = {
    command: new SlashCommandBuilder()
        .setName(COMMAND_NAME)
        // .setIntegrationTypes(ApplicationIntegrationType.)
        .setDescription("View active subscription channels"),
    // handle initial command interaction
    commandHandler: async (
        interaction: ChatInputCommandInteraction,
        data: Branches,
    ) => {
        let msg = "**Active Subscriptions**\n";
        Object.entries(subscriptions).forEach(([gymUID, channelIds]) => {
            msg += `${data[gymUID].displayName}\n`;
            channelIds.forEach((channelId) => {
                msg += `- <#${channelId}>\n`;
            });
        });
        await interaction.reply({
            content: Object.keys(subscriptions).length
                ? msg
                : "No active subscriptions.",
            flags: MessageFlags.Ephemeral,
        });
    },
};
