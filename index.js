const main = require("./main.js");
const router = require("./router.js");

router.setupRouts();
main.init();

process.on('uncaughtException', main.exitCleanup);



