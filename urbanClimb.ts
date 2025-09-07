import { BranchId, Station, UrbanClimbData } from "./types";

export const fetchLocationData = async (
    location?: string
): Promise<UrbanClimbData> => {
    const raw = await fetch(
        `https://urbanclimb.com.au/locations/${location ? `${location}/` : ""}`
    ).then((data) => data.text());

    const start =
        raw.indexOf('<script id="__NEXT_DATA__" type="application/json">') +
        '<script id="__NEXT_DATA__" type="application/json">'.length;
    const end = raw.length - "</script></body></html>".length;

    return JSON.parse(raw.slice(start, end));
};

// location is the id of the location if the when specified by locationCategory
export type UrbanNews = {
    title: string;
    posted: Date;
    heading: string;
    content: string;
    location?: string;
}[];

export type BranchData = Record<
    string,
    {
        name: BranchId;
        alerts: {
            name: string;
            start: Date | null;
            end: Date | null;
            description: string;
        }[];
        resets: { wallId: string; date: Date; wallName: string }[];
    }
>;

export const formatData = async () => {
    const allLocationData = await fetchLocationData();
    const branches = allLocationData.props.pageProps.branches;
    let allStations: null | Station[] = null;

    let output: BranchData = {};

    for (const branch of Object.keys(branches)) {
        const branchData = await fetchLocationData(
            branch === "westend" ? "west-end" : branch
        );
        if (!allStations)
            allStations = branchData.props.pageProps.route_setting_stations;

        output[branches[branch]] = {
            name: branch as BranchId,
            alerts: [],
            resets: [],
        };
        if (branchData.props.pageProps.data)
            // Create list of planned sets
            branchData.props.pageProps.data.routeSettingSchedule.forEach(
                (reset) => {
                    const station = allStations!.find(
                        (s) => s.id === reset.wallOrStation
                    );
                    output[branches[branch]].resets.push({
                        wallId: station!.id,
                        date: new Date(reset.date),
                        wallName: station!.name,
                    });
                }
            );

        // Create list of alerts
        branchData.props.pageProps.data.alerts.forEach((alert) => {
            let description = "";
            alert.modal.contentRaw.forEach((line) => {
                let newLine = "";
                line.children.forEach((child) => {
                    newLine += child.text ?? "";
                });
                description += newLine + "\n";
            });

            output[branches[branch]].alerts.push({
                name: alert.snippet,
                start: alert.startDate ? new Date(alert.startDate) : null,
                end: alert.endDate ? new Date(alert.endDate) : null,
                description: description,
            });
        });
    }

    return output;
};

export const getNewResets = (oldData: BranchData, newData: BranchData) => {
    let diff: BranchData = {};

    Object.keys(newData).forEach((location) => {
        if (!oldData[location]) {
            // Entire location is new
            diff[location] = newData[location];
            return;
        }
        newData[location].resets.forEach((reset) => {
            if (
                // if not in the old object then set is new
                !oldData[location].resets.find(
                    // Multiple resets for 1 wall can be posted but not at the same time
                    (r) =>
                        r.date.getTime() === reset.date.getTime() &&
                        r.wallId === reset.wallId
                )
            ) {
                if (!diff[location])
                    diff[location] = {
                        name: newData[location].name,
                        alerts: [],
                        resets: [],
                    };
                diff[location].resets.push(reset);
            }
        });
        newData[location].alerts.forEach((alert) => {
            if (
                // assuming all alerts have differnt names
                !oldData[location].alerts.find((a) => a.name === alert.name)
            ) {
                if (!diff[location])
                    diff[location] = {
                        name: newData[location].name,
                        alerts: [],
                        resets: [],
                    };
                diff[location].alerts.push(alert);
            }
        });
    });

    // return null if no new resets are found
    return Object.keys(diff).length ? diff : null;
};

export interface CapacityData {
    venue_id: string;
    status: string;
    capacity: number;
    current_percentage: number;
    currently_at_venue: number;
    notes: string[];
    last_updated: string;
}

export const getCapacityData = async (
    venueUUID: string
): Promise<CapacityData> => {
    return (
        await fetch(
            `https://pump.urbanclimb.com.au/api/venue/${venueUUID}/occupancy`,
            {
                headers: {
                    accept: "*/*",
                    "accept-language": "en-US,en;q=0.9",
                    authorization: "BASIC YmFzZTpGN0RCQXVZdHV2aE5kZA==",
                    "content-type": "application/json",
                    priority: "u=1, i",
                    "sec-ch-ua":
                        '"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": '"Linux"',
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-site",
                    cookie: "__stripe_mid=c4f1a52c-dadb-4878-9d13-f1775409ac0496c65d; uc_website_jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ0eXBlIjoiY3VzdG9tZXIiLCJpZCI6ImIwM2M1MzQxLTlkNTEtNGZjZS05NWRkLWUwMDA2NThlNDA0ZiIsImlhdCI6MTc1NzIyMjQzN30.gze0e5yUD873NvyPRLn6j_OlA-OHANYcCLHlcyKI9uk; __stripe_sid=7a6fc2fe-3376-418d-973b-86d7520390c4bd89e9",
                    Referer: "https://urbanclimb.com.au/",
                },
                body: null,
                method: "GET",
            }
        )
    ).json();
};
