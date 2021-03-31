import * as functions from "firebase-functions";
const dotenv = require("dotenv")
dotenv.config()

const got = require("got");
const dexClient = got.extend({
  headers: {
    "origin": "https://dex.guru",
    "referer": "https://dex.guru/",
  },
});

const DEX_GURU_DOP_API =
  "https://api.dex.guru/v1/tokens/0x844fa82f1e54824655470970f7004dd90546bb28-bsc";
const DEX_GURU_WAD_API =
  "https://api.dex.guru/v1/tokens/0x0feadcc3824e7f3c12f40e324a60c23ca51627fc-bsc";
const TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const STAGING_CHANNEL = "-1001306367429";
const PROD_CHANNEL = "-1001159768713";

const getDexGuruPrice = async (url) => {
  functions.logger.debug(url)
  const result = await dexClient.get(url);
  functions.logger.debug(result.body)
  const dexData = JSON.parse(result.body);
  return dexData.priceUSD ?? "0.00";
};

const getWADPrice = async () => {
  return await getDexGuruPrice(DEX_GURU_WAD_API);
};

const getDOPPrice = async () => {
  return await getDexGuruPrice(DEX_GURU_DOP_API);
};

export const dexPriceStaging = functions.https.onRequest(
  async (request, response) => {
    const TELEGRAM_SEND_API =
      `https://api.telegram.org/bot${TOKEN}/sendMessage?chat_id=${STAGING_CHANNEL}&text=`;
    functions.logger.debug(TELEGRAM_SEND_API)
    const dopPrice = await getDOPPrice();
    const wadPrice = await getWADPrice();

    await got.post(
      TELEGRAM_SEND_API + `DOP = ${dopPrice} USD%0AWAD = ${wadPrice} USD`,
    );

    response.send("Sent message to STAGING");
  },
);

export const dexPriceProd = functions.https.onRequest(
  async (request, response) => {
    const TELEGRAM_SEND_API =
      `https://api.telegram.org/bot${TOKEN}/sendMessage?chat_id=${PROD_CHANNEL}&text=`;

    const dopPrice = await getDOPPrice();
    const wadPrice = await getWADPrice();

    await got.post(
      TELEGRAM_SEND_API + `DOP = ${dopPrice} USD%0AWAD = ${wadPrice} USD`,
    );

    response.send("Sent message to PRODUCTION");
  },
);
