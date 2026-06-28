import {
    ButtonInteraction,
    ChatInputCommandInteraction,
    SlashCommandOptionsOnlyBuilder,
} from "discord.js";
import { gymCommand } from "./gym";
import { Branches } from "../data/urbanClimb";

export interface Command {
    command: SlashCommandOptionsOnlyBuilder;
    commandHandler: (
        interaction: ChatInputCommandInteraction,
        data: Branches,
    ) => Promise<void>;
    buttonHandler?: (
        interaction: ButtonInteraction,
        data: Branches,
    ) => Promise<void>;
}

export const availableCommands: Array<Command> = [gymCommand];
