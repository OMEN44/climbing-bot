import { Message } from "discord.js";

export const onMessage = (message: Message) => {
    if (message.author.bot || !message.channel.partial) return;
    if (message.content === "ping") message.channel.send("pong");
    if (message.content === "help")
        message.channel.send(
            `Hi! I am *Larry*.\n\n
            *Commands:*\n
            - 'ping': Pong!\n
            - 'help': Show this message\n
            - ~~'list': List all climbing gyms I know about~~\n
            - '@Larry <gym name>': Get the current capacity for a specific gym (or all gyms if no name is provided)`
        );
};

// fetch("https://pump.urbanclimb.com.au/api/", {
//     headers: {
//         accept: "*/*",
//         "accept-language": "en-US,en;q=0.9",
//         authorization: "BASIC YmFzZTpGN0RCQXVZdHV2aE5kZA==",
//         "content-type": "application/json",
//         priority: "u=1, i",
//         "sec-ch-ua":
//             '"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
//         "sec-ch-ua-mobile": "?0",
//         "sec-ch-ua-platform": '"Linux"',
//         "sec-fetch-dest": "empty",
//         "sec-fetch-mode": "cors",
//         "sec-fetch-site": "same-site",
//         cookie: "uc_website_jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ0eXBlIjoiY3VzdG9tZXIiLCJpZCI6ImIwM2M1MzQxLTlkNTEtNGZjZS05NWRkLWUwMDA2NThlNDA0ZiIsImlhdCI6MTc1NzI0OTE0OH0.5ROJaF3WIAYg7IBErsu3X1Ny8ScxCRjFoAPTBRF-9FM",
//         Referer: "https://urbanclimb.com.au/",
//     },
//     body: null,
//     method: "GET",
// })
//     .then((response) => response.json())
//     .then((data) => console.log(data));
