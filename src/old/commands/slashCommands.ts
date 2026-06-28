import { Collection } from "discord.js";
import { ClientExt } from "../core/types";

import user from "./utility/user";
import server from "./utility/server";

export const registerSlashCommands = async (client: ClientExt) => {
    client.commands = new Collection();
    client.commands.set(user.data.name, user);
    client.commands.set(server.data.name, server);

    client.on("interactionCreate", (interaction) => {
        if (!interaction.isChatInputCommand()) return;

        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            command.execute(interaction);
        } catch (error) {
            console.error(error);
            interaction.reply({
                content: "There was an error while executing this command!",
                ephemeral: true,
            });
        }
    });
};
