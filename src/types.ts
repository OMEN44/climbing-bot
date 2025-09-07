export type BranchId =
    | "milton"
    | "newstead"
    | "westend"
    | "collingwood"
    | "blackburn"
    | "townsville"
    | "adelaide";

export type BranchName =
    | "Milton"
    | "Newstead"
    | "West End"
    | "Collingwood"
    | "Blackburn"
    | "Townsville"
    | "Adelaide";

export type State = "QLD" | "NSW" | "VIC" | "WA" | "SA" | "TAS" | "NT";

export type TypeName =
    | "Location"
    | "LocationAddress"
    | "LocationFacilities"
    | "LocationTimetable"
    | "LocationRoute"
    | "LocationOpeningTimes"
    | "LocationBusyness"
    | "LocationInstagram"
    | "LocationMembership"
    | "LocationShop"
    | "LocationGymAlerts"
    | "ModalContent"
    | "LocationEtiquette"
    | "LocationContact"
    | "LocationCta"
    | "LocationGallery"
    | "LocationsNearBy"
    | "Slug"
    | "Page"
    | "Color"
    | "Image"
    | "SanityImageAsset"
    | "SanityImageMetadata"
    | "SanityImageHotspot"
    | "SanityImageCrop"
    | "OpeningTime"
    | "RouteSettingScheduleItem"
    | "NewsArchive"
    | "MainNewsCategories";

export interface UrbanClimbData {
    buildId: string;
    gsp: boolean;
    isFallback: boolean;
    page: string;
    props: {
        pageProps: {
            preview: boolean;
            areas: Area[];
            rawBranches: {
                id: string;
                name: BranchName;
                region_id: string;
            }[];
            branches: Record<BranchId, string>;
            footerFormOptions: {
                value: BranchId | "all";
                label: BranchName | "All Gym Updates";
            }[];
            // No location slug:
            locations: Location[];
            // Location slug:
            data: BranchData;
            news: {
                __typename: TypeName;
                title: string;
                slug: Slug;
                posted: string;
                facebookPixel?: any;
                thumbNailImage: Image;
                heading: string;
                excerpt: string;
                catagory: {
                    __typename: TypeName;
                    title: string;
                    id:
                        | "how-to"
                        | "kids"
                        | "member-news"
                        | "spotlight"
                        | "route-setting"
                        | "gym-alerts";
                };
                locationCatagory?: {
                    __typename: TypeName;
                    slug: Slug;
                }[];
            }[];
            route_setting_stations: Station[];
        };
        __N_SSG: boolean;
    };
    query: { slug?: BranchId };
    scriptLoader: any[];
}

export interface Station {
    id: string;
    name: string;
    station_type: "boulder" | "rope";
    activities: Array<"Boulder" | "TopRope" | "Lead" | "AutoBelay">;
}

export interface Location {
    __typename: TypeName;
    title: BranchName;
    slug: Slug;
    state: State;
    gymEmail: string;
    clubManagerEmail: string;
    hasCafe: boolean;
    color: Color;
    isComingSoon: boolean;
    cardTitleRaw: RawContent[];
    heroImage: Image;
    starburst?: StarBurst;
    secondaryStarburst?: StarBurst;
    locationOpeningTimes: {
        __typename: TypeName;
        title: string;
        times: {
            __typename: TypeName;
            type: string;
            age?: string;
            weekendTimes: string;
            weekdayTimes: string;
            isAvailable: boolean;
        }[];
    };
    routeSettingSchedule: {
        __typename: TypeName;
        day: string;
        date: string;
        noSets?: any;
        wallOrStation: string;
    }[];
}

export interface Image {
    __typename: TypeName;
    asset: {
        __typename: TypeName;
        url: string;
        metadata: {
            __typename: TypeName;
            lqip: string;
        };
    };
    hotspot?: {
        __typename: TypeName;
        x: number;
        y: number;
        height: number;
        width: number;
    };
    crop?: {
        __typename: TypeName;
        top: number;
        bottom: number;
        left: number;
        right: number;
    };
}

export interface StarBurst {
    __typename: TypeName;
    isSmall: any;
    color: Color;
    cta: string;
    subTitle: string;
    mobileCta: string;
    mobileSubTitle: string;
    link: string;
}

export interface Area {
    id: string;
    name: string;
    group_booking_schedules: {
        id: string;
        time: string;
        mon: boolean;
        tue: boolean;
        wed: boolean;
        thu: boolean;
        fri: boolean;
        sat: boolean;
        sun: boolean;
    }[];
    has_stations: boolean;
    venue: {
        id: string;
        name: BranchName;
        region_id: string;
    };
}

export interface Slug {
    __typename: "Slug";
    current: string;
}

export interface Color {
    __typename: TypeName;
    hex: string;
}

export interface RawContent {
    markDefs: any[];
    children: {
        marks: any[];
        text: string;
        _key: string;
        _type: string;
    }[];
    _type: string;
    style: string;
    _key: string;
}

export interface Module {
    __typename: TypeName;
    showModule: boolean;
    buttonText?: string;
    buttonLink?:
        | string
        | Slug
        | {
              __typename: TypeName;
              slug: Slug;
          };
}

export type BranchData = Location & Data;

export interface Data {
    facebookPixel?: any;
    timetable: Module;
    gymFacilities: Module & {
        title: string;
        facilities: string[];
        starBurst: StarBurst;
    };
    routeUpdate: Module;
    address: Module & {
        address: string;
        map: Image;
        addressUrl: string;
        phone: string;
    };
    busyness: Module;
    instagram: Module & {
        handle: string;
        headingRaw: RawContent[];
        overrideImage: Image;
        instagramLink: string;
    };
    membership: Module & {
        startingCost: string;
        priceInterval: string;
    };
    shop: Module & {
        image: Image;
    };
    alerts: {
        __typename: TypeName;
        snippet: string;
        modal: {
            __typename: TypeName;
            contentRaw: RawContent[];
            buttonText: any;
            buttonLink: any;
        };
        autoOpen?: boolean;
        startDate?: string;
        endDate?: string;
    }[];
    gymEtiquette: Module & {
        image: Image;
    };
    contact: Module & {
        subHeading: string;
        heading: string;
        email: string;
    };
    mobileCta: {
        __typename: TypeName;
        buttonText: string;
        buttonLink: {
            __typename: TypeName;
            slug: Slug;
        };
    };
    imageGallery: {
        __typename: TypeName;
        images: Image;
        caption: string;
    }[];
    gymsNearBy: {
        __typename: TypeName;
        gym: Location;
        aoc: string;
    }[];
}
