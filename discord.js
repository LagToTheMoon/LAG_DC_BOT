const Discord = require("discord.js");
const { token, ethscan_key, alchemy_key } = require("./token.json");
const client = new Discord.Client();
const request = require("request");
const cheerio = require("cheerio");
const axios = require("axios");
const ytdl = require("ytdl-core");

class Music {
  constructor() {
    this.isPlaying = {};
    this.queue = {};
    this.connection = {};
    this.dispatcher = {};
  }

  async join(msg) {
    // 如果使用者正在頻道中
    if (msg.member.voice.channel !== null) {
      // Bot 加入語音頻道
      this.connection[msg.guild.id] = await msg.member.voice.channel.join();
    } else {
      msg.channel.send("Please enter the voice channel first");
    }
  }

  async play(msg) {
    // 語音群的 ID
    const guildID = msg.guild.id;

    // 如果 Bot 還沒加入該語音群的語音頻道
    if (!this.connection[guildID]) {
      msg.channel.send("Please add the robot first `! !join` to the channel");
      return;
    }

    // 如果 Bot leave 後又未加入語音頻道
    if (this.connection[guildID].status === 4) {
      msg.channel.send("Please re-add the robot `!join` to the channel first");
      return;
    }

    // 處理字串，將 !!play 字串拿掉，只留下 YouTube 網址
    const musicURL = msg.content.replace(`!play`, "").trim();

    try {
      // 取得 YouTube 影片資訊
      const res = await ytdl.getInfo(musicURL);
      const info = res.videoDetails;

      // 將歌曲資訊加入隊列
      if (!this.queue[guildID]) {
        this.queue[guildID] = [];
      }

      this.queue[guildID].push({
        name: info.title,
        url: musicURL,
      });

      // 如果目前正在播放歌曲就加入隊列，反之則播放歌曲
      if (this.isPlaying[guildID]) {
        msg.channel.send(`Songs added to the queue：${info.title}`);
      } else {
        this.isPlaying[guildID] = true;
        this.playMusic(msg, guildID, this.queue[guildID][0]);
      }
    } catch (e) {
      console.log(e);
    }
  }

  playMusic(msg, guildID, musicInfo) {
    // 提示播放音樂
    msg.channel.send(`Music：${musicInfo.name}`);

    // 播放音樂
    this.dispatcher[guildID] = this.connection[guildID].play(
      ytdl(musicInfo.url, { filter: "audioonly" })
    );

    // 把音量降 50%，不然第一次容易被機器人的音量嚇到 QQ
    this.dispatcher[guildID].setVolume(0.5);

    // 移除 queue 中目前播放的歌曲
    this.queue[guildID].shift();

    // 歌曲播放結束時的事件
    this.dispatcher[guildID].on("finish", () => {
      // 如果隊列中有歌曲
      if (this.queue[guildID].length > 0) {
        this.playMusic(msg, guildID, this.queue[guildID][0]);
      } else {
        this.isPlaying[guildID] = false;
        msg.channel.send("Currently there is no music, please add music :D");
      }
    });
  }

  resume(msg) {
    if (this.dispatcher[msg.guild.id]) {
      msg.channel.send("Resume playback");

      // 恢復播放
      this.dispatcher[msg.guild.id].resume();
    }
  }

  pause(msg) {
    if (this.dispatcher[msg.guild.id]) {
      msg.channel.send("Pause Play");

      // 暫停播放
      this.dispatcher[msg.guild.id].pause();
    }
  }

  skip(msg) {
    if (this.dispatcher[msg.guild.id]) {
      msg.channel.send("Skip Current Songs");

      // 跳過歌曲
      this.dispatcher[msg.guild.id].end();
    }
  }

  nowQueue(msg) {
    // 如果隊列中有歌曲就顯示
    if (this.queue[msg.guild.id] && this.queue[msg.guild.id].length > 0) {
      // 字串處理，將 Object 組成字串
      const queueString = this.queue[msg.guild.id]
        .map((item, index) => `[${index + 1}] ${item.name}`)
        .join();
      msg.channel.send(queueString);
    } else {
      msg.channel.send("There are currently no songs in the queue");
    }
  }

  leave(msg) {
    // 如果機器人在頻道中
    if (
      this.connection[msg.guild.id] &&
      this.connection[msg.guild.id].status === 0
    ) {
      // 如果機器人有播放過歌曲
      if (this.queue.hasOwnProperty(msg.guild.id)) {
        // 清空播放列表
        delete this.queue[msg.guild.id];

        // 改變 isPlaying 狀態為 false
        this.isPlaying[msg.guild.id] = false;
      }

      // 離開頻道
      this.connection[msg.guild.id].disconnect();
    } else {
      msg.channel.send("Robotics did not join any channel");
    }
  }
}

function GetTransition(msg) {
  axios
    .get(
      `https://api.etherscan.io/api?module=account&action=tokennfttx&contractaddress=0x9C99d7f09d4a7e23EA4E36AeC4CB590C5bbdB0e2&page=1&offset=5&startblock=0&endblock=27025780&sort=desc&apikey=${ethscan_key}`
    )
    .then((res) => {
      let data = res.data.result;
      for (var i = 0; i < data.length; i++) {
        var d = new Date(data[i].timeStamp * 1000); //x1000 to convert from seconds to milliseconds var s = d.toUTCString()
        const embed = new Discord.MessageEmbed()
          .setColor("#ffb6c1")
          .setTitle("#LAG " + data[i].tokenID)
          .setURL(
            "https://opensea.io/assets/0x9c99d7f09d4a7e23ea4e36aec4cb590c5bbdb0e2/" +
              data[i].tokenID
          )
          .addField("TimeStamp", d.toUTCString())
          .addField("From", data[i].from)
          .addField("To", data[i].to)
          //   .addField("Gas", data[i].gas)
          //   .addField("GasPrice", data[i].gasPrice)
          //   .addField("GasUsed", data[i].gasUsed)
          //   .addField("CumulativeGasUsed", data[i].cumulativeGasUsed)
          .setImage(
            `https://images.raritysniffer.com/500/500/ipfs/QmVXnEpKpLrvzq9fHxjzENo5Q6VRXhXgR1dg5dEUWYw8dK/${
              data[i].tokenID.length == 1
                ? "000" + data[i].tokenID
                : data[i].tokenID.length == 2
                ? "00" + data[i].tokenID
                : data[i].tokenID.length == 3
                ? "0" + data[i].tokenID
                : data[i].tokenID
            }.png`
          )
          .setAuthor(
            "Love Addicted Girls",
            "https://lh3.googleusercontent.com/MPdjTLccNrB-qqO_26SiHjrJGq1qEsIvHj5zi1k8cmuYCbjL1BujP_ygPqDOYeUjQC1zncY1t11sJbmh6nfvebz4NZxfeEwdVLUnNw=s0",
            "https://twitter.com/SoudanNFT_LAG"
          );

        msg.channel.send({ embed });
      }
    });
}

function GetGas(msg) {
  axios
    .get(
      `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${ethscan_key}`
    )
    .then((res) => {
      const embed = new Discord.MessageEmbed()
        .setColor("#ffb6c1")
        .setTitle("Ethereum Gas Tracker⛽")
        .setURL("https://etherscan.io/gastracker")
        .addField("SafeGasPrice", res.data.result.SafeGasPrice)
        .addField("ProposeGasPrice", res.data.result.ProposeGasPrice)
        .addField("FastGasPrice", res.data.result.FastGasPrice)
        .addField("SuggestBaseFee", res.data.result.suggestBaseFee)
        .setAuthor(
          "Love Addicted Girls",
          "https://lh3.googleusercontent.com/MPdjTLccNrB-qqO_26SiHjrJGq1qEsIvHj5zi1k8cmuYCbjL1BujP_ygPqDOYeUjQC1zncY1t11sJbmh6nfvebz4NZxfeEwdVLUnNw=s0",
          "https://twitter.com/SoudanNFT_LAG"
        );
      msg.channel.send({ embed });
    });
}

function GetNews(msg) {
  request(
    {
      url: "https://doc.soudan-nft.com/",
      method: "GET",
    },
    (error, res, body) => {
      // 如果有錯誤訊息，或沒有 body(內容)，就 return
      if (error || !body) {
        return;
      }
      const data = [];
      const $ = cheerio.load(body); // 載入 body
      const news = $("#list a");
      let count = 0;
      for (let i = 0; i < news.length; i++) {
        const embed = new Discord.MessageEmbed()
          .setColor("#ffb6c1")
          .setTitle(news.eq(i).find("h2").text())
          .setURL(news.eq(i).attr("href"))
          .setAuthor(
            "Love Addicted Girls",
            "https://lh3.googleusercontent.com/MPdjTLccNrB-qqO_26SiHjrJGq1qEsIvHj5zi1k8cmuYCbjL1BujP_ygPqDOYeUjQC1zncY1t11sJbmh6nfvebz4NZxfeEwdVLUnNw=s0",
            "https://twitter.com/SoudanNFT_LAG"
          )
          .setImage(news.eq(i).find("img").attr("src"));
        msg.channel.send({ embed });
        if (count == 4) {
          break;
        }
        count++;
      }
    }
  );
}

function GetLag(msg, num) {
  const baseURL = `https://eth-mainnet.alchemyapi.io/v2/${alchemy_key}/getNFTMetadata`;
  const contractAddr = "0x9C99d7f09d4a7e23EA4E36AeC4CB590C5bbdB0e2";
  const tokenId = num + "";
  const tokenType = "erc721";

  var config = {
    method: "get",
    url: `${baseURL}?contractAddress=${contractAddr}&tokenId=${tokenId}&tokenType=${tokenType}`,
    headers: {},
  };
  const baseURL2 = `https://eth-mainnet.alchemyapi.io/v2/${alchemy_key}/getOwnersForToken`;

  var config2 = {
    method: "get",
    url: `${baseURL2}?contractAddress=${contractAddr}&tokenId=${tokenId}`,
    headers: {},
  };

  axios(config2)
    .then((response) => {
      let embed = new Discord.MessageEmbed()
        .setColor("#ffb6c1")
        .setTitle("LAG#" + num)
        .setURL(
          "https://opensea.io/assets/0x9c99d7f09d4a7e23ea4e36aec4cb590c5bbdb0e2/" +
            num
        )
        .setAuthor(
          "Love Addicted Girls",
          "https://lh3.googleusercontent.com/MPdjTLccNrB-qqO_26SiHjrJGq1qEsIvHj5zi1k8cmuYCbjL1BujP_ygPqDOYeUjQC1zncY1t11sJbmh6nfvebz4NZxfeEwdVLUnNw=s0",
          "https://twitter.com/SoudanNFT_LAG"
        )
        .setImage(
          "https://images.raritysniffer.com/500/500/ipfs/QmVXnEpKpLrvzq9fHxjzENo5Q6VRXhXgR1dg5dEUWYw8dK/" +
            (num < 10
              ? "000" + num
              : num < 100
              ? "00" + num
              : num < 1000
              ? "0" + num
              : num) +
            ".png"
        );

      embed.addField("owner", response.data.owners[0]);
      axios(config)
        .then((response) => {
          for (let i = 0; i < response.data.metadata.attributes.length; i++) {
            response.data.metadata.attributes;
            embed.addField(
              response.data.metadata.attributes[i].trait_type,
              response.data.metadata.attributes[i].value,
              true
            );
          }
          msg.channel.send({ embed });
        })
        .catch((error) => console.log(error));
    })
    .catch((error) => console.log(error));
}

function GetBlockChainNews(msg) {
  request(
    {
      url: "https://news.cnyes.com/news/cat/bc_crypto",
      method: "GET",
    },
    (error, res, body) => {
      if (error || !body) {
        return;
      }
      const data = [];
      const $ = cheerio.load(body); // 載入 body
      const news = $("._1Zdp");
      let count = 0;
      for (let i = 0; i < news.length; i++) {
        const embed = new Discord.MessageEmbed()
          .setColor("#ffb6c1")
          .setTitle(news.eq(i).attr("title"))
          .setURL("https://news.cnyes.com" + news.eq(i).attr("href"))
          .addField("Source", "anue鉅亨")
          .addField("Date", news.eq(i).find("time").text())
          .setAuthor(
            "Love Addicted Girls",
            "https://lh3.googleusercontent.com/MPdjTLccNrB-qqO_26SiHjrJGq1qEsIvHj5zi1k8cmuYCbjL1BujP_ygPqDOYeUjQC1zncY1t11sJbmh6nfvebz4NZxfeEwdVLUnNw=s0",
            "https://twitter.com/SoudanNFT_LAG"
          )
          .setImage(news.eq(i).find("img").attr("src"));
        msg.channel.send({ embed });
        if (count == 5) {
          break;
        }
        count++;
      }
    }
  );
}

const music = new Music();

// 連上線時的事件
client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// 當 Bot 接收到訊息時的事件
client.on("message", async (msg) => {
  //前置判斷
  try {
    if (!msg.guild || !msg.member) return; //訊息內不存在guild元素 = 非群組消息(私聊)
    if (!msg.member.user) return; //幫bot值多拉一層，判斷上層物件是否存在
    if (msg.member.user.bot) return; //訊息內bot值為正 = 此消息為bot發送
  } catch (err) {
    return;
  }

  try {
    const prefix = "!";
    if (msg.content.substring(0, prefix.length) === prefix) {
      const cmd = msg.content.substring(prefix.length).split(" ");

      switch (cmd[0]) {
        case "transfer":
          GetTransition(msg);
          break;
        case "gas":
          GetGas(msg);
          break;
        case "news":
          GetNews(msg);
          break;
        case "cn_news":
          GetBlockChainNews(msg);
          break;
        case "lag":
          if (isNaN(cmd[1]) == false) {
            var num = parseInt(cmd[1]);
            if (num >= 1 && num <= 4000) {
              GetLag(msg, num);
            } else {
              msg.reply("『Please enter Number』 ex:!lag 840");
            }
          }

          break;
        case "join":
          music.join(msg);
          break;
        case "play":
          if (msg.member.voice.channel) {
            await music.play(msg);
          } else {
            msg.reply("You must first join the Voice Channel");
          }
          break;
        // case "resume":
        //   music.resume(msg);
        //   break;
        // case "pause":
        //   music.pause(msg);
        //   break;
        case "skip":
          music.skip(msg);
          break;
        case "queue":
          music.nowQueue(msg);
          break;
        case "leave":
          music.leave(msg);
          break;
      }
    }
  } catch (err) {
    console.log("OnMessageError", err);
  }
});

client.login(token);
