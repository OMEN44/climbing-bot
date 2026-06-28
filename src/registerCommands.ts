import { REST, Routes } from "discord.js";
import { clientId, guildId, token } from "../config.json";
import { availableCommands } from "./commands/commands";

const register = async () => {
    // get command JSON
    const commandsJSON = availableCommands.map((c) => c.command.toJSON());

    // Construct and prepare an instance of the REST module
    const rest = new REST().setToken(token);

    // and deploy your commands!
    (async () => {
        try {
            console.log(
                `Started refreshing ${commandsJSON.length} application (/) commands.`,
            );

            let fullRoute;
            if (guildId) {
                fullRoute = Routes.applicationGuildCommands(clientId, guildId);
            } else {
                fullRoute = Routes.applicationCommands(clientId);
            }

            // The put method is used to fully refresh all commands in the guild with the current set
            const data = (await rest.put(fullRoute, {
                body: commandsJSON,
            })) as string;

            console.log(
                `Successfully reloaded ${data.length} application (/) commands.`,
            );
        } catch (error) {
            // And of course, make sure you catch and log any errors!
            console.error(error);
        }
    })();
};

register();
