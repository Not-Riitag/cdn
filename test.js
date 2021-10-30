const { SessionManager, UserManager } = require("./data-controller/index");
const config = require("./config.json")

async function main() {
    console.log(await UserManager.getUserLogin(config.user.user, config.user.password));
    process.exit(0);
}

main();