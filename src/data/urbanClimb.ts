import fs from "node:fs";
import { UrbanClimbData } from "../core/types";

export interface Station {
    name: string;
    activities: string[];
    lastSet: Date | null;
    nextSetStart: Date | null;
    nextSetEnd: Date | null;
}

export interface Branch {
    displayName: string;
    location: { address: string; mapsUrl: string } | null;
    facilities: string[];
    areas: Array<{
        id: string;
        hasStations: boolean;
        displayName: string;
    }>;
    openingHours: Array<{
        type: string;
        age: string | null;
        weekday: string;
        weekend: string;
    }>;
    images: Array<{
        url: string;
        alt: string;
    }>;
    stations: Record<string, Station>;
    alerts: Array<{
        important: boolean; // based on if the alert auto opens on the website
        message: string;
        content: object; // the content of the alert, which can be a string or an object with more details
        startDate: Date | null;
        endDate: Date | null;
    }>;
    capacity: {
        status: string | null;
        current: number | null;
        max: number | null;
        lastUpdateDayIndex: number | null; // index of the day for the last update (0-6, where 0 is Sunday)
        trend: Array<Record<(typeof indexToDay)[number], Array<number>>>; // 7 days x 20 min intervals
    };
}

export interface CapacityData {
    venue_id: string;
    status: string;
    capacity: number;
    current_percentage: number;
    currently_at_venue: number;
    notes: string[];
    last_updated: string;
}

export type Branches = Record<string, Branch>;

export const FAST_UPDATE_INTERVAL = 1 * 60 * 1000; // minutes (in milliseconds)
export const FAST_UPDATES_PER_DAY =
    (24 * 60 * 60 * 1000) / FAST_UPDATE_INTERVAL; // number of updates in a day
export const WEEKS_OF_TREND = 6; // number of weeks to keep in trend data

if ((24 * 60 * 60 * 1000) % FAST_UPDATE_INTERVAL !== 0) {
    console.error(
        "Invalid update interval. Interval must divide evenly into 24 hours.",
    );
    process.exit(1);
}

export const indexToDay = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
] as const;
export const dayToIndex: Record<(typeof indexToDay)[number], number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
};
const getAvergeArray = (arrs: number[][]): number[] => {
    return arrs[0].map((_, colIndex) => {
        // Sum the elements at the current index across all arrays
        const sum = arrs.reduce(
            (total, currentArray) => total + currentArray[colIndex],
            0,
        );
        // Divide by the number of arrays to get the average
        return sum / arrs.length;
    });
};

const fetchLocationData = async (
    location?: string,
): Promise<UrbanClimbData> => {
    const raw = await fetch(
        `https://urbanclimb.com.au/locations/${location ? `${location}/` : ""}`,
    ).then((data) => data.text());

    const start =
        raw.indexOf('<script id="__NEXT_DATA__" type="application/json">') +
        '<script id="__NEXT_DATA__" type="application/json">'.length;
    const end = raw.length - "</script></body></html>".length;

    return JSON.parse(raw.slice(start, end));
};

const getCapacityData = async (venueUUID: string): Promise<CapacityData> => {
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
            },
        )
    ).json();
};

let lastBuildId: string | null = null;

const setupData = async (savedData?: Branches): Promise<Branches> => {
    const output: Branches = savedData ?? {};
    const data = await fetchLocationData();

    // check build ID to see if data might have changed significantly since last fetch, and warn if it has
    // const buildId = data.buildId;
    // if (lastBuildId !== buildId) {
    //   console.warn("Build changed! Data might be different...");
    //   lastBuildId = buildId;
    // }

    const generalData = data.props.pageProps;

    const rawBranches = generalData.rawBranches;
    const locationsMap = Object.fromEntries(
        generalData.locations.map((loc) => [loc.title, loc]),
    );
    for (const branch of rawBranches) {
        const loc = locationsMap[branch.name];
        if (loc !== undefined) {
            const branchDraft: Branch = output[branch.id] ?? {};
            // treat the request data as source of truth
            branchDraft.displayName = branch.name;
            branchDraft.areas = generalData.areas
                .filter((area) => area.venue.id === branch.id)
                .map((area) => ({
                    id: area.id,
                    hasStations: area.has_stations,
                    displayName: area.name,
                }));
            branchDraft.images = [];
            if (loc.heroImage) {
                branchDraft.images.push({
                    url: loc.heroImage.asset.url,
                    alt: "Cover image for " + branch.name,
                });
            }
            if (loc.locationOpeningTimes) {
                branchDraft.openingHours = loc.locationOpeningTimes.times.map(
                    (time) => ({
                        // TODO: process these to date objects
                        type: time.type,
                        age: time.age || null,
                        weekday: time.weekdayTimes,
                        weekend: time.weekendTimes,
                    }),
                );
            } else {
                branchDraft.openingHours = [];
            }
            // initialise any remaining unset fields (probaly only needed if there is no save)
            if (!branchDraft.location) {
                branchDraft.location = null;
            }
            if (!branchDraft.alerts) {
                branchDraft.alerts = [];
            }
            if (!branchDraft.capacity) {
                branchDraft.capacity = {
                    status: null,
                    current: null,
                    max: null,
                    lastUpdateDayIndex: new Date().getDay(),
                    trend: [
                        {
                            Sunday: [],
                            Monday: [],
                            Tuesday: [],
                            Wednesday: [],
                            Thursday: [],
                            Friday: [],
                            Saturday: [],
                        },
                    ],
                };
            }
            if (!branchDraft.facilities) {
                branchDraft.facilities = [];
            }
            if (!branchDraft.images) {
                branchDraft.images = [
                    {
                        url: loc.heroImage.asset.url,
                        alt: "Cover image for " + branch.name,
                    },
                ];
            }
            if (!branchDraft.stations) {
                branchDraft.stations = {};
            }
            output[branch.id] = branchDraft;
        }
    }

    return output;
};

const updateBranchData = async (data: Branches) => {
    const entries = Object.entries(data);
    for (const [branchId, branch] of entries) {
        const slug = branch.displayName.toLowerCase().replaceAll(" ", "-");
        const props = (await fetchLocationData(slug)).props.pageProps;

        data[branchId].location = props.data.address
            ? {
                  address: props.data.address.address,
                  mapsUrl: props.data.address.addressUrl,
              }
            : null;
        if (props.data.alerts) {
            data[branchId].alerts = props.data.alerts.map((alert) => ({
                important: alert.autoOpen ?? false,
                message: alert.snippet,
                content: alert.modal,
                startDate: alert.startDate ? new Date(alert.startDate) : null,
                endDate: alert.endDate ? new Date(alert.endDate) : null,
            }));
        }
        if (props.data.imageGallery) {
            data[branchId].images.push(
                ...props.data.imageGallery
                    .map((image) => ({
                        url: image.image.asset.url,
                        alt: image.caption || `Image for ${branch.displayName}`,
                    }))
                    .filter(
                        (image) =>
                            !branch.images.some((img) => img.url === image.url),
                    ),
            );
        }
        if (props.data.gymFacilities)
            data[branchId].facilities = props.data.gymFacilities.facilities;

        if (props.data.routeSettingSchedule) {
            for (const setInfo of props.data.routeSettingSchedule) {
                const station = props.route_setting_stations.find(
                    (s) => s.id === setInfo.wallOrStation,
                );
                if (!station) continue; // shouldnt happen
                const stationDraft: Station = {
                    name: station.name,
                    activities: station.activities,
                    lastSet:
                        data[branchId].stations[station.id]?.lastSet ?? null,
                    nextSetStart:
                        data[branchId].stations[station.id]?.nextSetStart ??
                        null,
                    nextSetEnd:
                        data[branchId].stations[station.id]?.nextSetEnd ?? null,
                };

                const date = new Date(setInfo.date);
                if (date > new Date()) {
                    // future set
                    if (
                        !stationDraft.nextSetStart &&
                        !stationDraft.nextSetEnd
                    ) {
                        // must be new so set date for start and end
                        stationDraft.nextSetStart = date;
                        stationDraft.nextSetEnd = date;
                    } else if (
                        stationDraft.nextSetStart &&
                        date < stationDraft.nextSetStart &&
                        stationDraft.lastSet &&
                        date > stationDraft.lastSet
                    ) {
                        // between last set and next start, so update next start
                        stationDraft.nextSetStart = date;
                    } else if (
                        stationDraft.nextSetEnd &&
                        date > stationDraft.nextSetEnd
                    ) {
                        // after next end, so update next end
                        stationDraft.nextSetEnd = date;
                    }
                } else {
                    // past set, so update last set if its newer than the current last set
                    if (!stationDraft.lastSet || date > stationDraft.lastSet) {
                        stationDraft.lastSet = date;
                    }
                }

                data[branchId].stations[station.id] = stationDraft;
            }
        }
    }

    return data;
};

const updateCapacityData = async (data: Branches) => {
    const entries = Object.entries(data);
    for (const [branchId, _] of entries) {
        const capacityData = await getCapacityData(branchId);
        const capacity = data[branchId].capacity;

        capacity.status = capacityData.status;
        capacity.current = capacityData.currently_at_venue;
        capacity.max = capacityData.capacity;
        if (
            capacity.lastUpdateDayIndex === dayToIndex.Saturday &&
            capacity.lastUpdateDayIndex !== new Date().getDay()
        ) {
            if (capacity.trend.length >= WEEKS_OF_TREND) {
                // if we have too many weeks of data, remove the oldest week
                capacity.trend.shift();
            }
            // new week so add new element
            capacity.trend.push({
                Sunday: [],
                Monday: [],
                Tuesday: [],
                Wednesday: [],
                Thursday: [],
                Friday: [],
                Saturday: [],
            });
        }
        const dayTrend =
            capacity.trend[capacity.trend.length - 1][
                indexToDay[new Date().getDay()]
            ];
        if (dayTrend.length === FAST_UPDATES_PER_DAY) {
            // if we have a full day of data, remove the oldest entry
            dayTrend.shift();
        }
        const now = new Date();
        // only add if the time is between 6am and 9:59pm
        // if (!(now.getHours() < 6 || now.getHours() > 21)) {
        dayTrend.push(capacityData.currently_at_venue);
        // }
    }
};

export const handleData = async (
    onUpdate: (branches: Branches) => void,
): Promise<{ cleanup: () => void }> => {
    const saveExists = fs.readdirSync("./").includes("data.json");
    const savedData: Branches = {};
    if (saveExists) {
        try {
            const raw = fs.readFileSync("./data.json", "utf-8");
            Object.assign(savedData, JSON.parse(raw));
        } catch (e) {
            console.error("Failed to load saved data, starting fresh", e);
        }
    }

    let data: Branches = savedData;
    let counter = -1;

    let c = 0;
    setInterval(() => {
        c++;
    });

    const handle = async () => {
        if (counter >= FAST_UPDATES_PER_DAY || counter === -1) {
            counter = 0;
            // check for major changes to the branch data
            try {
                data = await setupData(savedData);
            } catch (e) {
                console.error("Failed to fetch data, keeping existing data", e);
                counter = -2;
            }
        }

        try {
            // update daily setting and alert data
            await updateBranchData(data);
            // update capacity data more frequently
            await updateCapacityData(data);
        } catch (e) {
            console.error("Failed to update data", e);
            counter = -1;
        }

        // save data
        try {
            const s = JSON.stringify(data);
            fs.writeFileSync("./data.json", s);
        } catch (e) {
            console.error("Failed to save data", e);
        }

        onUpdate(data);
        counter++;
    };

    handle();

    const interval = setInterval(async () => {
        handle();
    }, FAST_UPDATE_INTERVAL);

    const cleanup = () => {
        clearInterval(interval);
    };

    return { cleanup };
};

// return an array for each day of the week with the average capacity at
// each FAST_UPDATE_INTERVAL for that day, averaged across all weeks of data we have
export const getCapacityTrend = (data: Branches, branchId?: string) => {
    const getAverages = (trend: Branch["capacity"]["trend"]) => {
        const output: Record<(typeof indexToDay)[number], Array<number>> = {
            Sunday: [],
            Monday: [],
            Tuesday: [],
            Wednesday: [],
            Thursday: [],
            Friday: [],
            Saturday: [],
        };
        for (const day in output) {
            // only trust the most complete day of data incase there is down time
            // most complete is the days with the most entries
            const validDays: Record<
                (typeof indexToDay)[number],
                { length: number; data: Array<Array<number>> }
            > = {
                Sunday: { length: 0, data: [] },
                Monday: { length: 0, data: [] },
                Tuesday: { length: 0, data: [] },
                Wednesday: { length: 0, data: [] },
                Thursday: { length: 0, data: [] },
                Friday: { length: 0, data: [] },
                Saturday: { length: 0, data: [] },
            };
            trend.forEach((week) => {
                Object.entries(week).forEach(([d, values]) => {
                    const validDay =
                        validDays[d as (typeof indexToDay)[number]];
                    if (values.length > validDay.length) {
                        validDay.length = values.length;
                        validDay.data = [values];
                    } else if (values.length === validDay.length) {
                        validDay.data.push(values);
                    }
                });
            });
            const d = day as (typeof indexToDay)[number];
            output[d] = getAvergeArray(validDays[d].data);
        }
        return output;
    };

    if (branchId) {
        return getAverages(data[branchId].capacity.trend);
    } else {
        return Object.fromEntries(
            Object.entries(data).map(([id, branch]) => [
                id,
                getAverages(branch.capacity.trend),
            ]),
        );
    }
};
