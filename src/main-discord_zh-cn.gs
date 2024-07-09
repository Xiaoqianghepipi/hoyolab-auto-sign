const profiles = [
  {
    token: "ltoken=gBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxCY; ltuid=26XXXXX20;", 
    genshin: true, 
    honkai_star_rail: true, 
    honkai_3: false, 
    tears_of_themis: false,
    zenless_zone_zero: false,
    accountName: "你的名字",
    browserua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/114.0.0.0"
  }
];

const discord_notify = true
const myDiscordID = ""
const discordWebhook = ""

/** 以上为设定项，请参考 https://github.com/canaria3406/hoyolab-auto-sign 的说明进行设定**/
/** 以下为程序代码，请勿改动 **/

const urlDict = {
  Genshin: 'https://sg-hk4e-api.hoyolab.com/event/sol/sign?lang=zh-cn&act_id=e202102251931481',
  Star_Rail: 'https://sg-public-api.hoyolab.com/event/luna/os/sign?lang=zh-cn&act_id=e202303301540311',
  Honkai_3: 'https://sg-public-api.hoyolab.com/event/mani/sign?lang=zh-cn&act_id=e202110291205111',
  Tears_of_Themis: 'https://sg-public-api.hoyolab.com/event/luna/os/sign?lang=zh-tw&act_id=e202308141137581',
  Zenless_Zone_Zero: 'https://sg-act-nap-api.hoyolab.com/event/luna/zzz/os/sign?lang=zh-cn&act_id=e202406031448091'
};

async function main() {
  const messages = await Promise.all(profiles.map(autoSignFunction));
  const hoyolabResp = `${messages.join('\n\n')}`;

  if (discord_notify && discordWebhook) {
    postWebhook(hoyolabResp);
  }
}

function discordPing() {
  return myDiscordID ? `<@${myDiscordID}> ` : '';
}

function autoSignFunction({
  token,
  browserua,
  genshin = false,
  honkai_star_rail = false,
  honkai_3 = false,
  tears_of_themis = false,
  zenless_zone_zero = false,
  accountName
}) {
  const urls = [];

  if (genshin) urls.push(urlDict.Genshin);
  if (honkai_star_rail) urls.push(urlDict.Star_Rail);
  if (honkai_3) urls.push(urlDict.Honkai_3);
  if (tears_of_themis) urls.push(urlDict.Tears_of_Themis);
  if (zenless_zone_zero) urls.push(urlDict.Zenless_Zone_Zero);

  const header = {
    Cookie: token,
    'Accept': 'application/json, text/plain, */*',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'x-rpc-app_version': '2.34.1',
    'User-Agent': browserua,
    'x-rpc-client_type': '4',
    'Referer': 'https://act.hoyolab.com/',
    'Origin': 'https://act.hoyolab.com'
  };

  const options = {
    method: 'POST',
    headers: header,
    muteHttpExceptions: true,
  };

  let response = `${accountName} 的自动签到操作已完成`;

  var sleepTime = 0
  const httpResponses = []
  for (const url of urls) {
    Utilities.sleep(sleepTime);
    httpResponses.push(UrlFetchApp.fetch(url, options));
    sleepTime = 1000;
  }

  for (const [i, hoyolabResponse] of httpResponses.entries()) {
    const responseJson = JSON.parse(hoyolabResponse);
    const checkInResult = responseJson.message;
    const enGameName = Object.keys(urlDict).find(key => urlDict[key] === urls[i]);
    switch (enGameName) {
      case 'Genshin':
      gameName = '原神';
      break;
      case 'Star_Rail':
      gameName = '星穹铁道';
      break;
      case 'Honkai_3':
      gameName = '崩坏三';
      break;
      case 'Tears_of_Themis':
      gameName = '未定事件簿';
      break;
      case 'Zenless_Zone_Zero':
      gameName = '绝区零';
      break;
    }
    const isError = checkInResult != "OK";
    const bannedCheck = responseJson.data?.gt_result?.is_risk;

    if (bannedCheck) {
      response += `\n${gameName}: ${discordPing()} 自动签到失败，被人机验证阻止。`;
    } else {
      response += `\n${gameName}: ${isError ? discordPing() : ""}${checkInResult}`;
    }
  }

  return response;
}

function postWebhook(data) {
  let payload = JSON.stringify({
    'username': '自动签到',
    'avatar_url': 'https://i.imgur.com/LI1D4hP.png',
    'content': data
  });

  const options = {
    method: 'POST',
    contentType: 'application/json',
    payload: payload,
    muteHttpExceptions: true
  };

  UrlFetchApp.fetch(discordWebhook, options);
}
