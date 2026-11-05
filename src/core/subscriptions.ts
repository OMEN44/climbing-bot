import { Client } from "discord.js";
import { subscriptions } from "../commands/gym";
import { Branches } from "../data/urbanClimb";

export const handleSubscriptions = (
    client: Client,
    oldData: Branches | null,
    newData: Branches,
) => {
    if (!oldData) return;
    Object.entries(subscriptions).forEach(([uid, channelIds]) => {
        // check for changes for this branchUid
        const oldBranch = oldData[uid];
        const newBranch = newData[uid];

        if (!oldBranch || !newBranch) return;

        const newSets: {
            stationId: string;
            stationName: string;
            nextSetStart: Date | null;
            nextSetEnd: Date | null;
        }[] = [];
        const todaysSets: {
            stationId: string;
            stationName: string;
            nextSetStart: Date | null;
            nextSetEnd: Date | null;
        }[] = [];
        const newAlerts: { message: string }[] = [];

        // find changes in stations and alerts
        Object.entries(newBranch.stations).forEach(
            ([stationId, newStation]) => {
                const oldStation = oldBranch.stations[stationId];
                if (!oldStation) return;
                // if next set is more recent than the old one, add to newSets
                if (
                    newStation.nextSetStart &&
                    (!oldStation.nextSetStart ||
                        newStation.nextSetStart > oldStation.nextSetStart)
                ) {
                    newSets.push({
                        stationId,
                        stationName: newStation.name,
                        nextSetStart: newStation.nextSetStart,
                        nextSetEnd: newStation.nextSetEnd,
                    });
                }
            },
        );

        // find todays sets
        const today = new Date();
        Object.entries(newBranch.stations).forEach(([stationId, station]) => {
            if (
                station.nextSetStart &&
                station.nextSetStart < today &&
                station.nextSetEnd &&
                station.nextSetEnd > today
            ) {
                todaysSets.push({
                    stationId,
                    stationName: station.name,
                    nextSetStart: station.nextSetStart,
                    nextSetEnd: station.nextSetEnd,
                });
            }
        });

        // find new alerts
        newBranch.alerts.forEach((newAlert) => {
            const oldAlert = oldBranch.alerts.find(
                (a) => a.message === newAlert.message,
            );
            if (!oldAlert) {
                newAlerts.push(newAlert);
            }
        });

        channelIds.forEach((channelId) => {
            const channel = client.channels.cache.get(channelId);
            if (!channel || !channel.isTextBased() || channel.isDMBased())
                return;

            if (
                newSets.length > 0 ||
                newAlerts.length > 0 ||
                todaysSets.length > 0
            ) {
                let message = "# Todays Updates\n";

                if (newSets.length > 0) {
                    message += "## New Sets\n";
                    newSets.forEach((set) => {
                        message += `- **${set.stationName}**: ${set.nextSetStart?.toLocaleString()} - ${set.nextSetEnd?.toLocaleString()}\n`;
                    });
                }

                if (todaysSets.length > 0) {
                    message += "## Todays Sets\n";
                    todaysSets.forEach((set) => {
                        message += `- **${set.stationName}**: ${set.nextSetStart?.toLocaleString()} - ${set.nextSetEnd?.toLocaleString()}\n`;
                    });
                }

                if (newAlerts.length > 0) {
                    message += "## New Alerts\n";
                    newAlerts.forEach((alert) => {
                        message += `- **${alert.message}**\n`;
                    });
                }

                channel.send(message);
            }
        });
    });
};
