import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "./commands";
import { Branch, Branches } from "../data/urbanClimb";
import rawData from "../../data.json";

const COMMAND_NAME = "capacity";

const capacityMsgString = (branch: Branch) => {
    let msg = "";

    const percent = (branch.capacity.current ?? 0) / (branch.capacity.max ?? 1);
    msg += `**${branch.displayName}:**\n`;
    msg += `${branch.capacity.status} with ${branch.capacity.current ?? 0}/${branch.capacity.max ?? 1} climbers\n`;
    msg +=
        ":green_square:".repeat(Math.min(5, Math.floor(percent * 10))) +
        ":yellow_square:".repeat(
            Math.max(0, Math.min(3, Math.floor(percent * 10) - 5)),
        ) +
        ":red_square:".repeat(
            Math.max(0, Math.min(2, Math.floor(percent * 10) - 8)),
        ) +
        ":black_large_square:".repeat(10 - Math.floor(percent * 10)) +
        ` ${(percent * 100).toFixed(0)}%\n`;
    return msg;
};

export const capacityCommand: Command = {
    command: new SlashCommandBuilder()
        .setName(COMMAND_NAME)
        // .setIntegrationTypes(ApplicationIntegrationType.)
        .setDescription("View capacity information for each gym")
        .addStringOption((option) =>
            option
                .setName("branch")
                .addChoices(
                    rawData
                        ? Object.entries(rawData).map(([key, value]) => ({
                              name: value.displayName,
                              value: key,
                          }))
                        : [],
                )
                .setDescription(
                    "The name of the branch to view. Leave blank to view all branches",
                ),
        ),
    // handle initial command interaction
    commandHandler: async (
        interaction: ChatInputCommandInteraction,
        data: Branches,
    ) => {
        let msg = "";
        if (interaction.options.get("branch")?.value) {
            const branchUID = interaction.options.get("branch")
                ?.value as string;
            const branch = data[branchUID];
            msg += capacityMsgString(branch);
        } else {
            Object.entries(data).forEach(([_, branch]) => {
                msg += capacityMsgString(branch);
            });
        }

        await interaction.reply({
            content: msg,
        });
    },
};
