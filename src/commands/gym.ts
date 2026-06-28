import {
    ChatInputCommandInteraction,
    InteractionReplyOptions,
    MessageFlags,
    MessagePayload,
    SlashCommandBuilder,
} from "discord.js";
import { Branches } from "../data/urbanClimb";
import embeds from "./components/embeds";
import buttons, { ButtonAction } from "./components/buttons";
import { Command } from "./commands";

// map of gym UID to get updates for and the channel ID to send them to
const subscriptions: Record<string, string> = {};
const messageCache: Record<
    string,
    {
        gymUID: string;
        disabledButtons?: ButtonAction[];
        state: InteractionReplyOptions;
        createdAt: Date;
    }
> = {};

const COMMAND_NAME = "gym";
const navigationRow = (id: string) =>
    buttons.buttonRow(
        buttons.left(COMMAND_NAME, id),
        // buttons.select(COMMAND_NAME, id),
        buttons.right(COMMAND_NAME, id),
    );
const optionsRow = (
    id: string,
    subscribed: boolean,
    disabled?: ButtonAction[],
) =>
    buttons.buttonRow(
        buttons
            .home(COMMAND_NAME, id)
            .setDisabled(disabled?.includes("home") ?? false),
        buttons
            .setSchedule(COMMAND_NAME, id)
            .setDisabled(disabled?.includes("schedule") ?? false),
        buttons
            .news(COMMAND_NAME, id)
            .setDisabled(disabled?.includes("news") ?? false),
        buttons
            .capacity(COMMAND_NAME, id)
            .setDisabled(disabled?.includes("capacity") ?? false),
        subscribed
            ? buttons.unsubscribe(COMMAND_NAME, id)
            : buttons.subscribe(COMMAND_NAME, id),
    );

export const gymCommand = {
    command: new SlashCommandBuilder()
        .setName(COMMAND_NAME)
        // .setIntegrationTypes(ApplicationIntegrationType.)
        .setDescription("View gyms")
        .addStringOption((option) =>
            option
                .setName("branch")
                .setDescription(
                    "The name of the branch to view. Leave blank to view all branches",
                ),
        ),
    // handle initial command interaction
    commandHandler: async (
        interaction: ChatInputCommandInteraction,
        data: Branches,
    ) => {
        const id = interaction.id;
        const message = {
            embeds: [embeds.home(data[Object.keys(data)[0]])],
            components: [
                optionsRow(
                    id,
                    subscriptions[Object.keys(data)[0]] ===
                        interaction.channelId,
                    ["home"],
                ),
                navigationRow(id),
            ],
        };
        await interaction.reply(message);
        messageCache[id] = {
            gymUID: Object.keys(data)[0],
            state: message,
            createdAt: new Date(),
        };
    },
    // handle button interactions for this command
    buttonHandler: async (interaction, data) => {
        // check for cached message
        const uid = interaction.customId.split("-");
        if (uid.length < 3 || uid[0] !== COMMAND_NAME) {
            interaction.reply({
                content: "This interaction has expired.",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }
        const id = uid[1];
        const action = uid[2] as ButtonAction;
        const cached = messageCache[id];
        if (!cached) {
            await interaction.reply({
                content: "This interaction has expired.",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        if (action === "subscribe") {
            subscriptions[cached.gymUID] = interaction.channelId;
            const newMessage = {
                embeds: cached.state.embeds,
                components: [
                    optionsRow(
                        id,
                        true,
                        messageCache[id].disabledButtons ?? [],
                    ),
                    navigationRow(id),
                ],
            };
            await interaction.update(newMessage);
            messageCache[id].state = newMessage;
        } else if (action === "unsubscribe") {
            delete subscriptions[cached.gymUID];
            const newMessage = {
                embeds: cached.state.embeds,
                components: [
                    optionsRow(
                        id,
                        false,
                        messageCache[id].disabledButtons ?? [],
                    ),
                    navigationRow(id),
                ],
            };
            await interaction.update(newMessage);
            messageCache[id].state = newMessage;
        } else if (action === "schedule") {
        } else if (action === "news") {
        } else if (action === "capacity") {
            messageCache[id].disabledButtons = ["capacity"];
            // switch the to the capacity embed for the gym
            const newMessage = {
                embeds: [embeds.capacity(data, cached.gymUID)],
                components: [
                    optionsRow(
                        id,
                        subscriptions[cached.gymUID] === interaction.channelId,
                        messageCache[id].disabledButtons ?? [],
                    ),
                    navigationRow(id),
                ],
            };
            await interaction.update(newMessage);
            messageCache[id].state = newMessage;
        } else if (action === "select") {
        } else if (action === "home") {
            messageCache[id].disabledButtons = ["home"];
            const newMessage = {
                embeds: [embeds.home(data[cached.gymUID])],
                components: [
                    optionsRow(
                        id,
                        subscriptions[cached.gymUID] === interaction.channelId,
                        messageCache[id].disabledButtons ?? [],
                    ),
                    navigationRow(id),
                ],
            };
            await interaction.update(newMessage);
            messageCache[id].state = newMessage;
        } else if (action === "left" || action === "right") {
            // determine new gym based on button clicked
            const branchIds = Object.keys(data);
            const currentIndex = branchIds.indexOf(cached.gymUID);
            let newIndex = currentIndex;
            if (action === "left")
                newIndex =
                    (currentIndex - 1 + branchIds.length) % branchIds.length;
            else if (action === "right")
                newIndex = (currentIndex + 1) % branchIds.length;

            const newGymUID = branchIds[newIndex];
            const embedActionMap: Record<
            const newMessage = {
                embeds: [embeds.home(data[newGymUID])],
                components: [
                    optionsRow(
                        id,
                        subscriptions[newGymUID] === interaction.channelId,
                        messageCache[id].disabledButtons ?? [],
                    ),
                    navigationRow(id),
                ],
            };

            // respond and update cache
            await interaction.update(newMessage);
            messageCache[id].state = newMessage;
            messageCache[id].gymUID = newGymUID;
        }
    },
} satisfies Command;

export const cacheCleaner = (intervalMins: number, timeToLive: number) => {
    return setInterval(
        () => {
            const now = new Date();
            for (const [key, value] of Object.entries(messageCache)) {
                if (now.getTime() - value.createdAt.getTime() > timeToLive) {
                    delete messageCache[key];
                }
            }
        },
        intervalMins * 60 * 1000,
    );
};

export const handleSubscriptions = () => {};
