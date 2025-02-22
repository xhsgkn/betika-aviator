import { getWSDebugUrl } from "./utils.js";
import betikaInit from "./betika.js";
import logger from "./logger.js";
import './ping.js'


if (!process.env.BETIKA_PHONE || !process.env.BETIKA_PASSWORD){
    console.log(`ERROR: Phone and password not provided!`)
    console.log(`export BETIKA_PHONE="712345678" && export BETIKA_PASSWORD="4321abcd"`)
    process.exit(0)
}

const targetOrigin = 'https://www.betika.com'
const webSocketDebuggerUrl = await getWSDebugUrl(targetOrigin);

logger.info('Initializing...')
betikaInit(webSocketDebuggerUrl, {
    phone:process.env.BETIKA_PHONE,
    password:process.env.BETIKA_PASSWORD
})
