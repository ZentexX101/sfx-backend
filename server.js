const mongoose = require("mongoose");
const config = require("./src/config/config");
const app = require("./app");

let server;

async function main() {
  try {
    await mongoose.connect(config.database_url);
    server = app.listen(config.port, () => {
      console.log(`SFX Server is running on ${config.port}`);
    });
  } catch (err) {
    console.log(err);
  }
}

main();

// process.on("unhandledRejection", () => {
// 	console.log(`😈 unhandledRejection is detected, shutting down the server...`);
// 	if (server) {
// 		server.close(() => {
// 			process.exit(1);
// 		});
// 	}
// 	process.exit(1);
// });

// process.on("uncaughtException", () => {
// 	console.log(`😈 uncaughtException is detected, shutting down the server...`);
// 	process.exit(1);
// });
