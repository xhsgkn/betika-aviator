import { appendFileSync } from "node:fs";
import CDP from "chrome-remote-interface";
import {DateTime} from "luxon";
import * as cheerio from 'cheerio';

import { getWSDebugUrl } from "./utils.js";
import logger from "./logger.js";

const meta = {
  lastUpdatedAt: null,
  outputfile: null,
  target: null,
  closeClient: null
}

export default async function betikaInit(target, auth) {
  const client = await CDP({
    target,
  });

  const { Runtime } = client;

  await login(Runtime, auth.phone, auth.password);
  process.on("exit", async () => {
    logger.info('Shutting down...')
    await logout(Runtime)
    await client.close()
  });

  await new Promise((resolve) => setTimeout(resolve, Math.random() * 5*1000));

  await avt(Runtime);
}

async function login(Runtime, phone, password) {
  let result;

  const loginBtnSelector =
    "body > div.app > div.desktop-layout > header > div.topnav.top > div.topnav__right > div.top-session-button__container > a.top-session-button.button.button__secondary.outline.link";
  result = await Runtime.evaluate({
    expression: `document.querySelector('${loginBtnSelector}').click()`,
  });
  result.subtype == "error" && new Error(result.description);
  await new Promise((resolve) => setTimeout(resolve, Math.random() * 10000));

  const phoneInputSelector =
    "body > div.app > div.desktop-layout > div.desktop-layout__content > div.desktop-layout__content__center > div > div > div.session__form > div.input__container.session__form__input.session__form__phone > input";
  result = await Runtime.evaluate({
    expression: `document.querySelector('${phoneInputSelector}').value = '${phone}'`,
  });
  result.subtype == "error" && new Error(result.description);
  await new Promise((resolve) => setTimeout(resolve, Math.random() * 10000));

  const passwordInputSelector =
    "body > div.app > div.desktop-layout > div.desktop-layout__content > div.desktop-layout__content__center > div > div > div.session__form > div.session__form__password__container > div > input";
  result = await Runtime.evaluate({
    expression: `document.querySelector('${passwordInputSelector}').value = '${password}'`,
  });
  result.subtype == "error" && new Error(result.description);
  await new Promise((resolve) => setTimeout(resolve, Math.random() * 10000));

  const submitFormSelector =
    "body > div.app > div.desktop-layout > div.desktop-layout__content > div.desktop-layout__content__center > div > div > div.session__form > div.session__form__button__container > button";
  result = await Runtime.evaluate({
    expression: `document.querySelector('${submitFormSelector}').click()`,
  });
  result.subtype == "error" && new Error(result.description);

  logger.info('Logged In.')
}

async function logout(Runtime) {
  let result;

  const profileSelector =
    "body > div.app > div.desktop-layout > header > div.topnav.top > div.topnav__right > div.topnav__session__links.visible-desktop > a:nth-child(3) > svg";
  result = await Runtime.evaluate({
    expression: `document.querySelector('${profileSelector}').click()`,
  });
  result.subtype == "error" && new Error(result.description);

  const logoutBtnSelector =
    "body > div.app > div.desktop-layout > div.desktop-layout__content > div.desktop-layout__content__center > div > div > div.overlay-menu__strocked-card.account__section__support > button";
  result = await Runtime.evaluate({
    expression: `document.querySelector('${logoutBtnSelector}').click()`,
  });
  result.subtype == "error" && new Error(result.description);

  logger.info('Logged Out.')
}

async function avt(Runtime1) {
  let result;

  const avtBtnSelector =
    "body > div.app > div.desktop-layout > header > div.nav__container > div > a:nth-child(5)";
  result = await Runtime1.evaluate({
    expression: `document.querySelector('${avtBtnSelector}').click()`,
  });
  result.subtype == "error" && new Error(result.description);
  logger.info('Opened avt.')

  setInterval(async () => {
    if (
      !meta.target ||
      !meta.lastUpdatedAt ||
      (DateTime.now() - meta.lastUpdatedAt) >= 10 * 60 * 1000 // 10mins
    ) {
      meta.target = await getWSDebugUrl("https://aviator-next.spribegaming.com");
      meta.outputfile = `output/${DateTime.now().toFormat(
        "yyyyMMddHHmm"
      )}_avtoutput.txt`;

      logger.info('Trying to acquire avt target...')
      attachAvt(meta.target, meta.outputfile, meta);
      meta.lastUpdatedAt = DateTime.now();
  
      logger.info(`Target acquired url=${meta.target}`);
    }
    logger.info('Everything is alright.')
  }, 1*60*1000);//1min
}

async function attachAvt(target, outputfile, m) {
  const client = await CDP({
    target,
  });
  meta.closeClient && await meta.closeClient()
  meta.closeClient = client.close;

  const { DOM } = client;
  await DOM.getDocument({
    depth: -1,
    pierce: true,
  });

  DOM.childNodeInserted(async (params) => {
    const { nodeId, backendNodeId, attributes } = params.node;
    if (attributes?.includes("payouts")) {
      const html = (
        await DOM.getOuterHTML({
          nodeId,
          backendNodeId,
        })
      ).outerHTML;
      const $ = cheerio.load(html);
      const multiplierText = $(".bubble-multiplier.font-weight-bold")
        .text()
        .trim();
      m.lastUpdatedAt = DateTime.now();
      logger.info('Received a new datapoint.')

      appendFileSync(
        outputfile,
        `${DateTime.now().toISO()},${parseFloat(multiplierText)}\n`
      );
    }
  });
}
