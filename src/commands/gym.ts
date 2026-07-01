import {
    ButtonInteraction,
    ChatInputCommandInteraction,
    InteractionReplyOptions,
    InteractionUpdateOptions,
    MessageFlags,
    SlashCommandBuilder,
} from "discord.js";
import { Branches } from "../data/urbanClimb";
import embeds from "./components/embeds";
import buttons, { ButtonAction } from "./components/buttons";
import { Command } from "./commands";
import rawData from "../../data.json";

export type PageName = "home" | "schedule" | "news" | "capacity";

// map of gym UID to get updates for and the channel ID to send them to
export const subscriptions: Record<string, string[]> = {};
const messageCache: Record<
    string,
    {
        gymUID: string;
        currentPage: PageName;
        disabledButtons?: ButtonAction[];
        state: InteractionReplyOptions | InteractionUpdateOptions;
        createdAt: Date;
    }
> = {};

const COMMAND_NAME = "gym";
const navigationRow = (id: string) =>
    buttons.buttonRow(
        buttons.left(COMMAND_NAME, id),
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

export const buildMessage = (
    gymUID: string,
    interactionId: string,
    page: PageName,
    data: Branches,
    interaction: ChatInputCommandInteraction | ButtonInteraction,
) => {
    // find embed builder
    const pageEmbed =
        page === "home"
            ? [embeds.home(data[gymUID])]
            : page === "capacity"
              ? [embeds.capacity(data, gymUID)]
              : [];

    // determine disabled buttons
    const disabledButtons = messageCache[interactionId]?.disabledButtons ?? [];
    (["home", "schedule", "news", "capacity"] as ButtonAction[]).forEach(
        (button) => {
            const indexToRemove = disabledButtons.findIndex(
                (b) => b === button,
            );
            if (indexToRemove !== -1) disabledButtons.splice(indexToRemove, 1);
        },
    );
    disabledButtons.push(page);

    // build message
    const output = {
        embeds: pageEmbed,
        components: [
            optionsRow(
                interactionId,
                subscriptions[gymUID]?.includes(interaction.channelId) ?? false,
                disabledButtons,
            ),
            navigationRow(interactionId),
        ],
    };

    // update cache
    if (!messageCache[interactionId]) {
        messageCache[interactionId] = {
            gymUID,
            createdAt: new Date(),
            currentPage: page,
            state: output,
            disabledButtons,
        };
    } else {
        messageCache[interactionId].gymUID = gymUID;
        messageCache[interactionId].currentPage = page;
        messageCache[interactionId].state = output;
        messageCache[interactionId].disabledButtons = disabledButtons;
    }

    return output;
};

export const gymCommand = {
    command: new SlashCommandBuilder()
        .setName(COMMAND_NAME)
        // .setIntegrationTypes(ApplicationIntegrationType.)
        .setDescription("View gyms")
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
        const id = interaction.id;
        const gymUID =
            (interaction.options.get("branch")?.value as string) ??
            Object.keys(data)[0];
        const message = buildMessage(gymUID, id, "home", data, interaction);
        await interaction.reply(message);
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
            if (!subscriptions[cached.gymUID]) {
                subscriptions[cached.gymUID] = [];
            }
            subscriptions[cached.gymUID].push(interaction.channelId);
            const newMessage = buildMessage(
                cached.gymUID,
                id,
                cached.currentPage,
                data,
                interaction,
            );
            await interaction.update(newMessage);
        } else if (action === "unsubscribe") {
            subscriptions[cached.gymUID] = subscriptions[cached.gymUID].filter(
                (id) => id !== interaction.channelId,
            );
            const newMessage = buildMessage(
                cached.gymUID,
                id,
                cached.currentPage,
                data,
                interaction,
            );
            await interaction.update(newMessage);
        } else if (action === "schedule") {
        } else if (action === "news") {
        } else if (action === "capacity") {
            // switch the to the capacity embed for the gym
            const newMessage = buildMessage(
                cached.gymUID,
                id,
                "capacity",
                data,
                interaction,
            );
            await interaction.update(newMessage);
        } else if (action === "select") {
        } else if (action === "home") {
            const newMessage = buildMessage(
                cached.gymUID,
                id,
                "home",
                data,
                interaction,
            );
            await interaction.update(newMessage);
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

            const newMessage = buildMessage(
                newGymUID,
                id,
                cached.currentPage,
                data,
                interaction,
            );

            // respond and update cache
            await interaction.update(newMessage);
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
