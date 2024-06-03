// src/index.js
import express, {Express, Request, Response} from "express";
import {config} from "dotenv";
import {parse} from "csv";
import fs from "node:fs";

const processFile = async (sort: string | undefined) => {
    const records = [];
    const parser = fs
        .createReadStream(`private/nydata.csv`)
        .pipe(parse());
    for await (const record of parser) records.push(record);
    records.shift();

    if (sort == undefined) sort = "newest";
    if (sort === "newest") records.sort((r1, r2) => compareDate(r1[0], r1[1], r2[0], r2[1], true))
    else if (sort === "oldest") records.sort((r1, r2) => compareDate(r1[0], r1[1], r2[0], r2[1], false))
    else if (sort === "most_injured") records.sort((r1, r2) => r2[9] - r1[9])
    else if (sort === "most_killed") records.sort((r1, r2) => r2[10] - r1[10])
    return records;
};

function compareDate(d1: string, t1: string, d2: string, t2: string, newest: boolean): number {
    let time1 = new Date(Number(d1.substring(6)), Number(d1.substring(0, 2)), Number(d1.substring(3, 5)), Number(t1.substring(0, t1.indexOf(":"))), Number(t1.substring(t1.indexOf(":") + 1)));
    let time2 = new Date(Number(d2.substring(6)), Number(d2.substring(0, 2)), Number(d2.substring(3, 5)), Number(t2.substring(0, t2.indexOf(":"))), Number(t2.substring(t2.indexOf(":") + 1)));

    if (newest) return time2.getTime() - time1.getTime()
    else return time1.getTime() - time2.getTime()
}

config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

app.get("/", (req: Request, res: Response) => {
    res.redirect("/map");
});

app.get("/map", async (req: Request, res: Response) => {
    res.render("pages/map", {incidents: await processFile(undefined)});
});

app.get("/recent", async (req: Request, res: Response) => {
    res.render("pages/recent", {incidents: (await processFile(req.query.sort?.toString())).slice(0, 50)});
});

app.get("/submit", async (req: Request, res: Response) => {
    res.render("pages/submit");
});

app.post("/api/submit", async (req: Request, res: Response) => {
    const body = req.body;
    const records = [];
    const parser = fs
        .createReadStream(`private/nydata.csv`)
        .pipe(parse());
    for await (const record of parser) records.push(record);

    records.push([
        body.crash_date, body.crash_time, body.borough, undefined, body.latitude, body.longitude, undefined, undefined,
        undefined, body.injured, body.killed, body.factor_vehicle_0, body.factor_vehicle_1, body.factor_vehicle_2,
        undefined, undefined, body.type_vehicle_0, body.type_vehicle_1, body.type_vehicle_2, undefined, undefined
    ]);

    let recordString = "";
    records.forEach((record) => recordString += record + "\n");

    await fs.promises.writeFile(`private/nydata.csv`, recordString);

    res.statusCode = 500;
    res.send("Internal server error")
});

app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});