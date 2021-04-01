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
const DEX_GURU_BASE_API = "https://api.dex.guru/v1/tokens/"
const tokens = [
  { id: 'DOP', address: '0x844fa82f1e54824655470970f7004dd90546bb28-bsc'},
  { id: 'WAD', address: '0x0feadcc3824e7f3c12f40e324a60c23ca51627fc-bsc'},
];
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const STAGING_CHANNEL = "-1001306367429";
const PROD_CHANNEL = "-1001159768713";

const getAllTokenPrice = async () => {
  let symbols = []

  tokens.forEach(token => {
    symbols.push(getDexGuruPrice(token))
  });
  
  const results = await Promise.all(symbols)
  let message = ["💵 Token Price Whisper%0A"];
  results.forEach( result => message.push(`💰 ${result.symbol} = ${new Intl.NumberFormat('en-IN', { maximumSignificantDigits: 3, style: 'currency', currency: 'USD' }).format(result.price)}%0A`))

  return message.join('')
}

const getDexGuruPrice = async (token) => {
  functions.logger.debug(`${DEX_GURU_BASE_API}${token.address}`)
  const result = await dexClient.get(`${DEX_GURU_BASE_API}${token.address}`);
  const dexData = JSON.parse(result.body);
  return {
    symbol: token.id,
    price: dexData.priceUSD ?? "0.00"
  }
}

const whisper = async (channel, message) => {
  const TELEGRAM_SEND_API =
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage?chat_id=${channel}&text=${message}`;
  await got.post(TELEGRAM_SEND_API,);
}

export const dexPriceStaging = functions.https.onRequest(
  async (request, response) => {
    const message = await getAllTokenPrice()
    whisper(STAGING_CHANNEL, message)
    response.send("Sent message to STAGING");
  },
);

export const dexPriceProd = functions.https.onRequest(
  async (request, response) => {
    const message = await getAllTokenPrice()
    whisper(PROD_CHANNEL, message)
    response.send("Sent message to PRODUCTION");
  },
);
