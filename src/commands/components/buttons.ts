import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export type ButtonAction =
    | "left"
    | "right"
    | "select"
    | "back"
    | "schedule"
    | "news"
    | "capacity"
    | "subscribe"
    | "unsubscribe"
    | "home";

const left = (commandName: string, id?: string | number) =>
    new ButtonBuilder()
        .setCustomId(`${commandName}-${id ? `${id}-` : ""}left`)
        .setEmoji("⬅️")
        .setStyle(ButtonStyle.Secondary);
const select = (commandName: string, id?: string | number) =>
    new ButtonBuilder()
        .setCustomId(`${commandName}-${id ? `${id}-` : ""}select`)
        .setLabel("Select")
        .setStyle(ButtonStyle.Primary);
const right = (commandName: string, id?: string | number) =>
    new ButtonBuilder()
        .setCustomId(`${commandName}-${id ? `${id}-` : ""}right`)
        .setEmoji("➡️")
        .setStyle(ButtonStyle.Secondary);
const back = (commandName: string, id?: string | number) =>
    new ButtonBuilder()
        .setCustomId(`${commandName}-${id ? `${id}-` : ""}back`)
        .setLabel("Back")
        .setStyle(ButtonStyle.Secondary);
const setSchedule = (commandName: string, id?: string | number) =>
    new ButtonBuilder()
        .setCustomId(`${commandName}-${id ? `${id}-` : ""}schedule`)
        .setLabel("Schedule")
        .setStyle(ButtonStyle.Primary);
const news = (commandName: string, id?: string | number) =>
    new ButtonBuilder()
        .setCustomId(`${commandName}-${id ? `${id}-` : ""}news`)
        .setLabel("News")
        .setStyle(ButtonStyle.Primary);
const capacity = (commandName: string, id?: string | number) =>
    new ButtonBuilder()
        .setCustomId(`${commandName}-${id ? `${id}-` : ""}capacity`)
        .setLabel("Capacity")
        .setStyle(ButtonStyle.Primary);
const subscribe = (commandName: string, id?: string | number) =>
    new ButtonBuilder()
        .setCustomId(`${commandName}-${id ? `${id}-` : ""}subscribe`)
        .setLabel("Subscribe")
        .setStyle(ButtonStyle.Success);
const unsubscribe = (commandName: string, id?: string | number) =>
    new ButtonBuilder()
        .setCustomId(`${commandName}-${id ? `${id}-` : ""}unsubscribe`)
        .setLabel("Unsubscribe")
        .setStyle(ButtonStyle.Danger);
const home = (commandName: string, id?: string | number) =>
    new ButtonBuilder()
        .setCustomId(`${commandName}-${id ? `${id}-` : ""}home`)
        .setLabel("Home")
        .setStyle(ButtonStyle.Secondary);

const buttonRow = (...components: ButtonBuilder[]) =>
    new ActionRowBuilder<ButtonBuilder>().addComponents(...components);

export default {
    left,
    right,
    select,
    setSchedule,
    news,
    capacity,
    subscribe,
    unsubscribe,
    home,
    buttonRow,
};
