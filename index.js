const dotenv = require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const BotToken = process.env.BOT_TOKEN;
const request = require('request');
const { BitlyClient } = require('bitly');
const bitly = new BitlyClient(process.env.BITLY_KEY, {});
const cron = require('node-cron');
const getYoutubeSubtitles = require('@joegesualdo/get-youtube-subtitles-node');
const getVideoId = require('get-video-id');
const bot = new TelegramBot(BotToken, {
  polling: true
});
const hk = require('@moondef/hacker-news-api');
//

// about
bot.onText(/\/about/, function (msg, match) {
  const chatId = msg.chat.id;
  let about = "Hello! Welcome to <b>Jarvis Bot</b>.\nA personal bot meeting all the basic needs of college students & student (developers)\nThis Bot is made by <a href=\"https://github.com/raghav4/\">Raghav</a>, <a href=\"https://github.com/mayankharbola/\">Mayank</a>, <a href=\"https://github.com/saurabh2908/\">Saurabh</a>";
  bot.sendMessage(msg.chat.id, about, {
    disable_web_page_preview: true,
    parse_mode: "HTML"
  });

});

// start
bot.onText(/\/start/, function (msg, match) {
  const chatId = msg.chat.id;
  console.log(msg);
  bot.sendMessage(chatId, ` Hey ${msg.chat.first_name}👋\nWelcome to Jarvis Bot!\nType /help for more`);
});

// echo
bot.onText(/\/echo (.+)/, function (msg, match) {
  const chatId = msg.chat.id;
  const echo = match[1];
  bot.sendMessage(chatId, echo);
  //bot.sendMessage(msg.chat.id,"<b>bold</b> \n <i>italic</i> \n <em>italic with em</em> \n <a href=\"http://www.example.com/\">inline URL</a> \n <code>inline fixed-width code</code> \n <pre>pre-formatted fixed-width code block</pre>" ,{parse_mode : "HTML"});

});

// help
bot.onText(/\/help/, function (msg, match) {
  const chatId = msg.chat.id;
  const helpMessage = `Hello! Welcome to Jarvis Bot 🤖, your personalized bot where you can get things done easily with a tap!\nHere are some of the features you can try out\nNote: Replace <whatever> with desired input to make it work\n1. /echo <Print Something>\n2. /news - Get the Latest trending News. You can view the entire news without leaving the application, queries will be added.\n3. /movie <MOVIE_NAME> - Get the Movie Ratings, Runtime.\n4. /shortlink <URL> - Create short urls.\n5. /dictionary <WORD_TO_SEARCH> - Gives the defintion, can be added more.\n6. /reminder - Set reminders, further instructions will be given.\n6. /ytt <COUNTRY_CODE> - Shows the trending videos in the country.`;
  bot.sendMessage(chatId, helpMessage);
});

// news
bot.onText(/\/news (.+)/, function (msg, match) {
  const query = match[1];
  const chatId = `${msg.chat.id}&disable_web_page_preview=True`;
  request(`https://newsapi.org/v2/top-headlines?country=${query}&apiKey=${process.env.NEWSAPI_KEY}`, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      let el;
      let ctr = 0;
      let text = "";
      let res = JSON.parse(body);
      for (let i = 0; i < 10; i++) {
        let obj = {}
        text += `${i+1}. ${res.articles[i].title}\nRead more at: ${res.articles[i].url}\n\n`;
      }
      bot.sendMessage(chatId, text, {
        disable_web_page_preview: true
      });
    }
  });
});

// movie
bot.onText(/\/movie (.+)/, function (msg, match) {
  // let news= match[1];
  let movie = match[1];
  let chatId = msg.chat.id;

  request(`http://www.omdbapi.com/?apikey=${process.env.MOVIEDB_KEY}&t=${movie}`, function (err, res, body) {
    let response = JSON.parse(body);
    if (!err && res.statusCode == 200) {
      console.log(response);
      bot.sendMessage(chatId, `Movie 🎬 : ${response.Title}\nReleased on : ${response.Released}\nRuntime : ${(parseInt(response.Runtime)/60).toFixed(2)} hrs\nImdb Rating : ${response.imdbRating}/10\nRotten Tomatoes : ${response} `);
    }
  });
});

// shortlink
bot.onText(/\/shortlink (.+)/, async function (msg, match) {
  const chatId = msg.chat.id;
  const uri = match[1];

  let result;
  try {
    result = await bitly.shorten(uri);
  } catch (e) {
    throw e;
  }
  bot.sendMessage(chatId, `Here's your generated shortlink : ${result.url}`);
});

//dictionary
bot.onText(/\/dictionary (.+)/, function (msg, match) {
  const chatId = msg.chat.id;
  const term = match[1];
  let options = {
    method: 'GET',
    url: 'https://mashape-community-urban-dictionary.p.rapidapi.com/define',
    qs: {
      term: `${term}`
    },
    headers: {
      'x-rapidapi-host': 'mashape-community-urban-dictionary.p.rapidapi.com',
      'x-rapidapi-key': process.env.RAPIDAPI_KEY
    }
  };
  // Handle Error
  request(options, function (error, response, body) {
    let res = JSON.parse(body);
    let value = res.list[0].definition;
    if ((!response) || error) {
      bot.sendMessage('Meaning of the request word not found :( , please check the word again!!');
      throw new Error(error);
    }
    console.log(value);
    bot.sendMessage(chatId, `Meaning : \n ${value}`);
  });
});

// reminder 

bot.onText(/\/reminder/, function (msg, match) {
  bot.sendMessage(msg.chat.id, `Hello! ${msg.chat.first_name}, What do you want to be reminded of? [Start next message with /save]`)
    .then(res => {
      bot.onText(/\/save (.+)/, (message, match) => {
        let reminder = match[1];
        if (reminder) {
          bot.sendMessage(message.chat.id, `Got it! What time? [example: /time (HH:MM:SS:AM|PM)]`)
            .then(() => {
              bot.onText(/\/time (.+)/, (message, match) => {
                let inputTime = match[1];
                console.log(inputTime, reminder);
                let task = cron.schedule('* * * * *', () => {
                  let today = new Date();
                  let time = (today.getHours() % 12) + ":" + today.getMinutes();
                  console.log(inputTime, time);
                  console.log(inputTime);
                  if (inputTime == time) {
                    bot.sendMessage(msg.chat.id, reminder);
                    task.stop();
                  }
                });
              })
            })
        }
      })
    })
})

// 

// Youtube trending videos.

bot.onText(/\/ytt (.+)/, function (msg, match) {
  const CountryCode = match[1];
  const chatId = msg.chat.id;
  request(`https://www.googleapis.com/youtube/v3/videos?part=snippet%2CcontentDetails%2Cstatistics&chart=mostPopular&regionCode=${CountryCode}&key=${process.env.YOUTUBE_KEY}`,
    function (err, res, body) {
      if (!err && res.statusCode == 200) {
        const response = JSON.parse(body);
        let TrendingVids = '';
        let videoUrl = '';
        let ctr = 0;
        for (key of response.items) {
          ++ctr;
          TrendingVids = TrendingVids + `${ctr}. ${key.snippet.title}\n`;
          videoUrl = `Video link: youtube.com/watch?v=${key.id}\n`;
          TrendingVids += videoUrl;
        }
        bot.sendMessage(chatId, TrendingVids, {
          disable_web_page_preview: true
        });
      } else {
        console.log("Something went wrong while getting trending section!!");
        bot.sendMessage(chatId, "Sorry something went wrong getting trending section!\nPlease use correct country code or try again later.");
      }
    })

})

// Youtube transcript

bot.onText(/\/yttranscript (.+)/, function (msg, match) {
  const chatId = `${msg.chat.id}&disable_web_page_preview=True`;
  const videoURL = match[1];
  const videoId = getVideoId(`${videoURL}`);
  console.log('Video id is \n', videoId.id);
  getYoutubeSubtitles(videoId.id, {
      type: 'nonauto'
    })
    .then(subtitles => {
      console.log(`Subtitles are as follows\n ${subtitles}`)
    })
    .catch(err => {
      console.log('error is \n', err)
    });
});

//  HackerNews

bot.onText(/\/hn/, async function(msg,match){
  const chatId = msg.chat.id;
  const popular = await hk.getNewStories(); // you will get IDs of popular news
  //const newsItem = await hk.getItem(popular[0]);
  let newsItem = '';
  for(var i = 0;i<10;i++){
    let ithNews = await hk.getItem(popular[i]);
    newsItem += `Id: ${ithNews.id} , News: ${ithNews.title} , Url: ${ithNews.url}\n\n`;
    console.log(ithNews);
  }
  console.log(newsItem);
  bot.sendMessage(chatId,newsItem, { disable_web_page_preview: true });
});