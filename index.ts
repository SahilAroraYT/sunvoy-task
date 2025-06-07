import * as fs from "fs";
import puppeteer from "puppeteer";

let cookies: string | null;

async function login() {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto("https://challenge.sunvoy.com/login", {
      waitUntil: "networkidle2",
    });

    
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
  } catch (error) {
    console.error("Error: Login failed", error);
  }
}

async function getUsers() {
  try {
    const usersResponse = await fetch(
      "https://challenge.sunvoy.com/api/users",
      {
        method: "POST",
        headers: {
          Accept: "*/*",
          Origin: "https://challenge.sunvoy.com",
          Referer: "https://challenge.sunvoy.com/list",
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36",
          Cookie: cookies ?? "",
        },
      },
    );

    const users = await usersResponse.json();

    fs.writeFileSync("users.json", JSON.stringify(users, null, 2));
  } catch (error) {
    console.error("Error: Error fetching users");
  }
}

async function start() {
  await login();
  await getUsers();
}

start();
