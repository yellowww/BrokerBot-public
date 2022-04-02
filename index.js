const main = require("./main.js");
const router = require("./router.js");

router.setupRouts();
main.init();


process.on('uncaughtException', main.exitCleanup);

process.on('exit', main.envCleanup);
process.on('SIGINT', main.envCleanup);
process.on('SIGUSR1', main.envCleanup);
process.on('SIGUSR2', main.envCleanup);




