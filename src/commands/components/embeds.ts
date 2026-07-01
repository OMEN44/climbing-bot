import { APIEmbedField, EmbedBuilder } from "discord.js";
import {
    Branch,
    Branches,
    getCapacityTrend,
    indexToDay,
} from "../../data/urbanClimb";

const baseEmbed = (args: {
    title: string;
    description?: string;
    thumbnail?: string;
    fields?: APIEmbedField[];
}) =>
    new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(args.title)
        .setDescription(args.description ?? null)
        .setThumbnail(args.thumbnail ?? null)
        .addFields(args.fields ?? [])
        .setTimestamp();

const formatMostRecentSetDate = (
    branch: Branch,
    dateKey: keyof Pick<
        Branch["stations"][string],
        "lastSet" | "nextSetStart" | "nextSetEnd"
    >,
) => {
    return Object.entries(branch.stations)
        .filter(([_, station]) => station[dateKey] !== null)
        .sort((a, b) => {
            return (
                new Date(a[1][dateKey]!).getTime() -
                new Date(b[1][dateKey]!).getTime()
            );
        })
        .map(
            ([_, station]) =>
                `${station.name}: ${station[dateKey] ? new Date(station[dateKey]).toUTCString().split(" ").slice(0, 3).join(" ") : "N/A"}`,
        )
        .join("\n");
};

const home = (branch: Branch) =>
    baseEmbed({
        title: branch.displayName,
        description: `${branch.displayName} is at ${(((branch.capacity.current ?? 0) / (branch.capacity.max ?? 1)) * 100).toFixed(0)}% capacity!`,
        thumbnail: branch.images[0]?.url,
        fields: [
            {
                name: "Most Recent Set",
                value: formatMostRecentSetDate(branch, "lastSet"),
            },
            {
                name: "Planned Sets",
                value: formatMostRecentSetDate(branch, "nextSetEnd"),
            },
            ...(branch.location
                ? [
                      {
                          name: "Location",
                          value: `[${branch.location.address}](${branch.location.mapsUrl})`,
                      },
                  ]
                : ([] as APIEmbedField[])),
            ...branch.openingHours.map((line) => ({
                name: `${line.type} ${line.age ? `(${line.age})` : ""}`,
                value: `- Weekdays: ${line.weekday}\n- Weekends: ${line.weekend}`,
            })),
        ],
    });
const capacity = (branches: Branches, branchUID: string) => {
    const GRID_SIZE = 7;

    const branch = branches[branchUID];
    const data = branch.capacity;
    const currentDay = indexToDay[new Date().getDay()];
    // const trend = getCapacityTrend(branches, branchUID)[currentDay];
    // console.log(trend);

    // get the most recent trend data for the current day
    const trend = data.trend[data.trend.length - 1]?.[currentDay];
    // console.log(trend);
    // generate a percentage for every third value starting at the most recent value
    // store GRID_SIZE values or as many as are available in the trend
    const percentages = (
        trend?.filter((_, i) => i % 3 === 0).slice(0, GRID_SIZE) ?? []
    ).map((value) =>
        data.max ? Math.round((value / data.max) * GRID_SIZE) : 0,
    );
    // console.log(percentages);
    while (percentages.length < GRID_SIZE) {
        percentages.unshift(0);
    }
    const rows = [];
    for (let i = 0; i < percentages.length; i++) {
        const row = [];
        for (let j = 0; j < GRID_SIZE; j++) {
            row.push(
                j < percentages[i] ? ":green_square:" : ":black_large_square:",
            );
        }
        rows.push(row.join(""));
    }
    // console.log(percentages);
    // console.log(rows);

    return baseEmbed({
        title: `${branch.displayName} Capacity`,
        description: `Currently at ${(data.current && data.max ? (data.current / data.max) * 100 : 0).toFixed(0)}% capacity with ${data.current ?? "N/A"} climbers!`,
        thumbnail: branch.images[0]?.url,
        fields: [
            {
                name: "Trend",
                value: rows.reverse().join("\n") || "No trend data available",
            },
            {
                name: "Last Update",
                value:
                    data.lastUpdateDayIndex !== null
                        ? `Day index ${data.lastUpdateDayIndex}`
                        : "N/A",
            },
        ],
    });
};

const news = (branch: Branch) => {
    const alerts = branch.alerts;
};

const schedule = {};
const alerts = {};

export default {
    home,
    capacity,
    news,
    schedule,
    alerts,
};
