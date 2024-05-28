// src/index.js
import express, {Express, Request, Response} from "express";
import { config} from "dotenv";
import { parse} from "csv";
import fs from "node:fs";

const processFile = async () => {
    const records = [];
    const parser = fs
        .createReadStream(`private/nydata.csv`)
        .pipe(parse({
            // CSV options if any
        }));
    for await (const record of parser) {
        // Work with each record
        records.push(record);
    }
    records.shift();
    return records;
};

config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.set("view engine", "ejs");

app.get("/", (req: Request, res: Response) => {
    res.redirect("/map");
});

app.get("/map", async (req: Request, res: Response) => {
    res.render("pages/map", { incidents: await processFile() });
});

app.get("/recent", async (req: Request, res: Response) => {
    res.render("pages/recent", { incidents: await processFile() });
});

app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});