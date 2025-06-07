import * as fs from "fs";
import puppeteer from "puppeteer";
import crypto from "crypto";
let cookies;
function createSignedRequest(params) {
    const timestamp = Math.floor(Date.now() / 1e3).toString();
    const requestParams = { ...params, timestamp };
    const payload = Object.keys(requestParams)
        .sort()
        .map(key => `${key}=${encodeURIComponent(requestParams[key])}`)
        .join("&");
    const hmac = crypto.createHmac("sha1", "mys3cr3t");
    hmac.update(payload);
    const checkcode = hmac.digest("hex").toUpperCase();
    return {
        payload,
        checkcode,
        fullPayload: `${payload}&checkcode=${checkcode}`,
        timestamp
    };
}
async function login() {
    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto("https://challenge.sunvoy.com/login", {
            waitUntil: "networkidle2",
        });
        // Fill in the login form
        await page.type('input[name="username"]', "demo@example.org");
        await page.type('input[name="password"]', "test");
        await Promise.all([
            page.click('button[type="submit"]'),
            page.waitForNavigation({ waitUntil: "networkidle2" }),
        ]);
        const pageCookies = await page.cookies();
        cookies = pageCookies
            .map((cookie) => `${cookie.name}=${cookie.value}`)
            .join("; ");
        console.log("Login Successful");
        console.log("Cookies:", cookies);
        await browser.close();
    }
    catch (error) {
        console.error("Error: Login failed", error);
    }
}
async function getUsers() {
    try {
        const usersResponse = await fetch("https://challenge.sunvoy.com/api/users", {
            method: "POST",
            headers: {
                "Accept": "*/*",
                "Origin": "https://challenge.sunvoy.com",
                "Referer": "https://challenge.sunvoy.com/list",
                "User-Agent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36",
                Cookie: cookies ?? "",
            },
        });
        const users = await usersResponse.json();
        fs.writeFileSync("users.json", JSON.stringify(users, null, 2));
    }
    catch (error) {
        console.error("Error: Error fetching users");
    }
}
async function getCurrentUser() {
    try {
        const params = {
            apiuser: "demo@example.org",
            language: "en_US",
            openId: "openid456",
            operateId: "op789",
            userId: "88619348-dbd9-4334-9290-241a7f17dd31"
        };
        const { fullPayload } = createSignedRequest(params);
        const currentUserResponse = await fetch("https://api.challenge.sunvoy.com/api/settings", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "*/*",
                "Origin": "https://challenge.sunvoy.com",
                "Referer": "https://challenge.sunvoy.com/",
            },
            body: fullPayload
        });
        const currentUser = await currentUserResponse.json();
        console.log(currentUser);
        let existingData = [];
        if (fs.existsSync("users.json")) {
            const fileData = fs.readFileSync("users.json", "utf-8");
            if (fileData) {
                existingData = JSON.parse(fileData);
            }
        }
        existingData.push(currentUser);
        fs.writeFileSync("users.json", JSON.stringify(existingData, null, 2));
    }
    catch (error) {
        console.error("Error fetching current user");
    }
}
async function start() {
    await login();
    await getUsers();
    await getCurrentUser();
}
start();
