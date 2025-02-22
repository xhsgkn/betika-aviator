import { spawn, execSync } from "child_process";
import logger from "./logger.js";

setInterval(() => {
  const proc = spawn("ping", ["-c 5", "google.com"]);

  proc.on("close", (exitCode) => {
    if (exitCode == 0) {
      logger.info("There's internet connectivity.");
    } else {
      logger.info("There's no internet connectivity.");
      // execSync(`reboot`)
      // TODO: Restart the process
    }
  });

  proc.on("error", (error) => {
    console.log(error);
  });
}, 10*60*1000);
