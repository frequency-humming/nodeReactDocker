const { Pool } = require("pg");
const http = require("http");
const fs = require("fs");

const cert = "/home/server.crt";
let caCertificate;
try {
  caCertificate = fs.readFileSync(cert).toString();
} catch (error) {
  console.error("Failed to read the certificate", error);
}

const pool = new Pool({
  user: process.env.user,
  host: process.env.HOSTNAME,
  database: process.env.database,
  password: process.env.password,
  port: 5432,
  max: 40,
  idleTimeoutMillis: 15000,
  connectionTimeoutMillis: 15000,
  ssl: {
    rejectUnauthorized: true,
    ca: caCertificate,
  },
});

let clients = [];
let events = [];

const eventData = (req, res) => {
  events.length = 0;
  clients.length = 0;

  pool.connect((err, client, release) => {
    if (err) {
      return res.status(500).send("Error Connecting to Resources");
    }
    client.query('SELECT * FROM "GuestUser"', (err, result) => {
      release();

      if (err) {
        return res.status(500).send("Error Retrieving to Resources");
      }
      let data = new Array();
      for (x in result.rows) {
        let date = new Date(result.rows[x].Created_At);
        data.push({
          account: x,
          Id: result.rows[x].Id,
          App: result.rows[x].App,
          User: result.rows[x].User__c,
          Image: result.rows[x].Image_Type,
          Login: result.rows[x].Login_Type,
          Date: `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`,
        });
      }
      res.status(200).json({ message: data });
    });
  });
};

function sendEventsToAll(newEvent) {
  clients.forEach((client) => {
    client.response.write(`data: ${newEvent}\n\n`);
  });
}

const addEvent = (request, response) => {
  const newEvent = request.body.payload;
  console.log(newEvent);
  events.push(newEvent);
  sendEventsToAll(newEvent);
  response.status(200).send("ok");
};

const eventsHandler = (request, response) => {
  const headers = {
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
    "Cache-Control": "no-cache, no-transform",
    agent: http.globalAgent,
  };

  response.writeHead(200, headers);

  events.forEach((event) => {
    response.write("event: message\n");
    response.write(`data: ${event}`);
    response.write("\n\n");
  });

  const intervalId = setInterval(async () => {
    const newEvents = events.slice(-1);
    newEvents.forEach((event) => {
      response.write("event: message\n");
      response.write(`data: ${event}`);
      response.write("\n\n");
    });
  }, 200);

  const clientId = Date.now();
  const newClient = { id: clientId, response };

  newClient.response.setTimeout(0);
  clients.push(newClient);

  request.on("close", () => {
    console.log(`${clientId} Connection closed`);
    clients = clients.filter((client) => client.id !== clientId);
    clearInterval(intervalId);
  });
};

module.exports = {
  eventData,
  addEvent,
  eventsHandler,
};
