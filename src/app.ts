import { startServer } from "./servers/web";

async function main() {
    await startServer();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});