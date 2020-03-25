const low = require('lowdb');
const FileAsync = require('lowdb/adapters/FileAsync');
const moment = require('moment');
const axios = require('axios');
const Push = require('pushover-notifications');
const config = require('./config.json');

const { dbname, country, interval, pushoverUser, pushoverToken, countryEmoji } = config;

const adapter = new FileAsync(`./data/${dbname}.json`);

const sendPush = (msg) => {
  const p = new Push({
    user: pushoverUser,
    token: pushoverToken,
  });

  p.send(msg, (err) => {
    if (err) {
      throw err;
    }
    // eslint-disable-next-line no-console
    console.log({
      time: moment().format(),
      message: 'Push notification sent',
      notification: msg.message,
    });
  });
};

const getCovidData = async () => {
  let db;
  let res;
  try {
    db = await low(adapter);
    res = await axios.get(`https://corona.lmao.ninja/countries/${country}`);
  } catch (err) {
    throw err.message;
  }

  // Create default database with name specified in config.json
  const database = {};
  database[dbname] = [];
  db.defaults(database).write();

  // Get database
  const getDatabase = db.get(dbname);
  const lastUpdate = getDatabase.last().get('data');

  if (JSON.stringify(lastUpdate.value()) === JSON.stringify(res.data)) {
    // eslint-disable-next-line no-console
    console.log({
      time: moment().format(),
      message: 'Nothing to update',
    });
  } else {
    getDatabase
      .push({
        id: getDatabase.size() + 1,
        time: moment().format(),
        data: res.data,
      })
      .write();

    const cases = lastUpdate.get('cases').value();
    const deaths = lastUpdate.get('deaths').value();
    const recovered = lastUpdate.get('recovered').value();
    const todayCases = lastUpdate.get('todayCases').value();
    const todayDeaths = lastUpdate.get('todayDeaths').value();

    const message = `🦠 ${cases} (${todayCases}) 💀 ${deaths} (${todayDeaths}) ❤️ ${recovered}`;

    const msg = {
      message,
      title: `COVID-19: ${countryEmoji}`,
    };
    sendPush(msg);
  }
};
getCovidData();
setInterval(getCovidData, interval);
