console.log("   ____                                         _   ____");
console.log("  |  _ \\  __ _  ___ _ __ ___   ___  _ __       | | / ___|");
console.log("  | | | |/ _` |/ _ \\ '_ ` _ \\ / _ \\| '_ \\   _  | | \\___ \\");
console.log("  | |_| | (_| |  __/ | | | | | (_) | | | | | |_| |  ___) |");
console.log("  |____/ \\__,_|\\___|_| |_| |_|\\___/|_| |_|  \\___/  |____/\n\n");

// npm install socket.io
// npm i @polkadot/api

//

var supported_currencies={
  'DOT-L': {
    chain_name: "lleo-DOT",
    kind: "native",
    decimals: 10,
    // rpc_url: "wss://rpc.polkadot.io"
    rpc_url: "wss://node-polkadot.zymologia.fi"
  },

  DOT: {
    chain_name: "polkadot",
    kind: "native",
    decimals: 10,
    rpc_url: "wss://rpc.polkadot.io"
  },

  'USDC-L': {
    chain_name: "lleo-USDC",
    kind: "asset",
    asset_id: 1337,
    decimals: 6,
    rpc_url: "wss://node-polkadot-ah.zymologia.fi"
  },

  USDT: {
    chain_name: "assethub-polkadot",
    kind: "asset",
    asset_id: 1984,
    decimals: 6,
    rpc_url: "wss://assethub-polkadot-rpc.polkadot.io"
  },

  USDC: {
    chain_name: "assethub-polkadot",
    kind: "asset",
    asset_id: 1337,
    decimals: 6,
    rpc_url: "wss://assethub-polkadot-rpc.polkadot.io"
  },

};

var providers = {
  'Dwellir': 'wss://statemint-rpc.dwellir.com',
  'Dwellir Tunisia': 'wss://statemint-rpc-tn.dwellir.com',
  'IBP-GeoDNS1': 'wss://sys.ibp.network/statemint',
  'IBP-GeoDNS2': 'wss://sys.dotters.network/statemint',
  'LuckyFriday': 'wss://rpc-asset-hub-polkadot.luckyfriday.io',
  'OnFinality': 'wss://statemint.api.onfinality.io/public-ws',
  'Parity': 'wss://polkadot-asset-hub-rpc.polkadot.io',
  'RadiumBlock': 'wss://statemint.public.curie.radiumblock.co/ws',
  'Stakeworld': 'wss://dot-rpc.stakeworld.io/assethub'
};

  // get random provider
  var keys = Object.keys(providers);
  var Key = keys[Math.floor(Math.random() * keys.length)];
  var Value = providers[Key];
  console.log("Random provider for assethubs: "+Key+" "+Value);
  if(supported_currencies['USDT']) {
    supported_currencies['USDT'].name = Key;
    supported_currencies['USDT'].rpc_url = Value;
  }
  if(supported_currencies['USDC']) {
    supported_currencies['USDC'].name = Key;
    supported_currencies['USDC'].rpc_url = Value;
  }
  // delete providers[Key];

document={
   getElementById: function() { return { innerHTML: "" }; },
   querySelector: function() { return { innerHTML: "" }; },
   querySelectorAll: function() { return []; },
};

const { exit } = require('process');
DOT = require('./DOT.js');

DOT.noweb = 1; // веба у нас тут нету, подавить все веб-сообщения

DOT.D={

  transferAll: async function(pair, to, CUR) { to=DOT.west(to,CUR);
    var bal=false;
    if(DOT.nodes[CUR].asset_id) bal = await DOT.Balance(pair.west,CUR); // для ассетхабов нужен баланс
    console.log(`[!] TransferAll: ${bal} ${CUR} from ${pair.west} to ${to}`);

    const transfer = DOT.TransferAll(to, bal, CUR);
    try {
        const hash = await transfer.signAndSend(pair);
	      console.log(`[!] Transaction sent with hash: ${hash}`);
	      return hash;
    } catch(er) {
	      console.log(`[!] Error transaction: ${er}`);
    }
    return false;
  },
    //  var hash = await DOT.topUpFromAlice(pay_acc,DOT.chain.total_planks);

  pay_acc: function(order,CUR) {
   try {
    var keyring = new polkadotKeyring.Keyring({ type: 'sr25519' });
    var pair = keyring.addFromMnemonic(DOT.daemon.seed)
      .derive("/"+DOT.daemon.destination)
      .derive("/"+order+CUR);
    var public = pair.publicKey;
    pair.pub0x = "0x"+Buffer.from(public).toString('hex');
    pair.west = DOT.west(pair.pub0x,CUR);
   } catch(er) {
    	console.log(`[!] Error: ${er}`);
	    return false;
   }
    return pair;
  },

  date: function() {
    var now = new Date();
    var year = now.getFullYear();
    var month = (now.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-based
    var day = now.getDate().toString().padStart(2, '0');
    var hours = now.getHours().toString().padStart(2, '0');
    var minutes = now.getMinutes().toString().padStart(2, '0');
    var seconds = now.getSeconds().toString().padStart(2, '0');
    return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
  },

  work: async function(pair, amount, order, CUR) {
    var pay_acc = pair.west;

    console.log("Work: "+pay_acc+" "+amount+" "+order+" "+CUR);

    // Сперва проверим, не было ли уже оплаты
    var s = await DOT.D.read(pay_acc, BasePaid);
    if(s) {
      console.log("Already paid (BasePaid): "+s);
      return {result: "paid", date: s.split(' ')[1], amount: s.split(' ')[2], hash: s.split(' ')[3], payment: "old"};
    }

    // Ладно, проверим баланс
    try {
	      await DOT.connect(CUR);
	      var balance = await DOT.Balance(pay_acc,CUR);
    } catch(er) {
	      return {error: ''+er};
    }
    // Пишем логи
    DOT.D.save(DOT.D.date()+" "+pay_acc+" "+amount+" "+order, BaseWait);

    if(balance < amount) {
      return {result: "waiting", balance: balance, amount: amount};
    }

    var s = await DOT.D.read(pay_acc, BaseTran);
    if(s) {
        console.log("Already transfered (BaseTran): "+s);
        return {result: "paid", balance: balance, date: s.split(' ')[1], amount: s.split(' ')[2], payment: "process"};
    }

    // Опа, оплата готова, начинаем трансфер
    console.log("READY! Balance transfering: "+balance);

    // Пометить в тран-базе
    var s = pay_acc+" "+DOT.D.date()+" "+amount+" "+order;
    DOT.D.save(s, BaseTran);
    // Начать трансфер
    try {
        var hash = await DOT.D.transferAll(pair, DOT.daemon.destination, CUR);
        console.log("Now transfered, hash: "+hash);
        // Пометить в пейд-базе
        var s = pay_acc+" "+DOT.D.date()+" "+amount+" "+hash+" "+order;
        DOT.D.save(s, BasePaid);
    } catch(er) {
	      return {error: ''+er};
    }

    return {result: "paid", balance: balance, date: s.split(' ')[1], amount: s.split(' ')[2], hash: s.split(' ')[3], payment: "new"};
  },


  save: async function(data, file) { if(!file) file = BaseWait;
    const key = data.split(' ')[0];
    const s = await DOT.D.read(key, file);
    if(s) return false;
    fs.appendFile(file, data+"\n", 'utf-8', err => { if(err) { throw err; } });
    return true;
  },

  read: async function(key, file) { if(!file) file = BaseWait;
    return new Promise((resolve, reject) => {
        if(!fs.existsSync(file)) resolve(false);
        const fileStream = fs.createReadStream(file);
        const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
        var ret = false;
        rl.on('line',(line) => { if(line.startsWith(key+' ')) { ret = line; rl.close(); } });
        rl.on('close',() => { resolve(ret); });
        rl.on('error',() => { resolve(false); });
    });
  },

};

console.log("Loading environment variables");

DOT.daemon.server = process.env['KALATORI_HOST']; // "0.0.0.0:16726"
DOT.daemon.seed = process.env['KALATORI_SEED']; // "bottom drive obey lake curtain smoke basket
DOT.daemon.destination = process.env['KALATORI_DESTINATION']; // "0x7a8e3cbf653a65077179947e250892e579c8fb39167ec1ce26a4a6acbc5a0365"
DOT.daemon.remark = process.env['KALATORI_REMARK'];
"server seed destination remark".split(" ").forEach((v) => { console.log("\t"+v+" = "+DOT.daemon[v]); });

polkadotUtil = require('@polkadot/util');
const { cryptoWaitReady } = require('@polkadot/util-crypto');
polkadotApi = require("@polkadot/api");
polkadotKeyring = require('@polkadot/keyring');

DOT.nodes=supported_currencies;

// console.clear();

function get_nodes(CUR) {
  var N = Object.assign({}, DOT.nodes[CUR]);
  N.api = (N.api ? true : false);
  delete N.x2;
  delete N.x3;
  return N;
}

(async () => { // Load all crypto
    await cryptoWaitReady();
    // await waitReady();
    var k=0; for(var CUR in DOT.nodes) {
      console.log((++k)+') Connect "'+CUR+'"\t'+DOT.nodes[CUR].rpc_url);
      await DOT.chain_info(CUR);
      console.log(get_nodes(CUR));
    }
})();


var server_info={
  version: "2.01 nodeJS LLeo",
  instance_id: "cunning-garbo",
  debug: true,
  kalatori_remark: DOT.daemon.remark,
  // recipient: DOT.daemon.destination,
};


// File system
const fs = require('fs');
const readline = require('readline');
const BaseWait = 'base_wait.txt';
const BasePaid = 'base_paid.txt';
const BaseTran = 'base_tran.txt';

const express = require("express");
const { createServer } = require("http");
const { parse } = require("path");
const { Server } = require("socket.io");

let app = express();
const port = DOT.daemon.server.split(':')[1]; // "0.0.0.0:16726"// 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin); // Да вот вам, ебучие параноидальные сучата, бляди унылые, гандоны сморщенные, ненавижу пидарасов, уволенных из Microsoft и несущих теперь всем свои сраные нравоучения, поучите блять меня, суки вшивые
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'X-PINGOTHER, Content-Type, x-requested-with');
  next();
 });

// https://alzymologist.github.io/kalatori-api/
//                           _
//         ___    _ __    __| |   ___   _ __
//        / _ \  | '__|  / _` |  / _ \ | '__|
//       | (_) | | |    | (_| | |  __/ | |
//        \___/  |_|     \__,_|  \___| |_|
//
app.post("/v2/order/*", async (req, res) => {

    // Ещё какая-то йобань неизвестная
    if(req.url.split("/")[4] == "forceWithdrawal") {
        return res.status(200).send({result: "OK" });
    }

    // блять наркоманы,  половина данных GET, половина POST, как хуй на душу влезет
    var order = req.url.split("/")[3]; // ID of order to track payments for
    var amount = 1*req.body.amount; // (in selected currency; not in Plancks) This parameter can be skipped on subsequent requests
    var CUR = req.body.currency; // Currency (human-readable ticker, one of the values listed in the /status::supported_currencies) If no currency is specified, but amount is present, server will return error 400.

    console.log("\n------- Order: "+amount+" "+CUR+" ["+order+"] -------\n");   

    // var currency_block = get_nodes(CUR);
    // supported_currencies.find((v) => v.currency == currency);
    
    var callback = req.body.callback; // "Меньше всего нужны мне твои каллбэки" (с) Земфира
    var status = 443;

    // Делаем наши проверки
    var error = [];
    if(!amount) error.push({"parameter": "amount", "message": "'amount' can't be blank if 'currency' is specified"});
    if(!DOT.nodes[CUR]) error.push({"parameter": "currency", "message": "Currency is not supported"});
    if(error.length) return res.status(400).send(error);

    // Делаем наши дела
    var pair = DOT.D.pay_acc(order, CUR);
    var payment_account = pair.west;
    var r = await DOT.D.work(pair, amount, order, CUR);

console.log("Payment result: "+JSON.stringify(r));

    // Проверяем amount
    if(r.amount != amount) status = 409; // processed with different parameters (amount/currency), and cannot be updated
    else {
      if(r.payment == "old" || r.payment == "process" || r.payment == "new") status = 200; // exists
      else if(!r.payment) status = 201; // created
    }

var ara = {
  server_info: server_info,
  order: order,
  payment_status: (r.result=='waiting' ? "pending" : "paid"), // "Мы не можем похвастаться мудростью глаз и умелыми жестами рук" (с) Цой
  "withdrawal_status": "waiting", // А ебитесь сами конями
  payment_account: payment_account,
  amount: amount,
  currency: CUR, // currency_block,
  callback: callback,
  recipient: DOT.daemon.destination,
  "transactions": [
    {
    "block_number": 123456,
    "position_in_block": 1,
    timestamp: (!r.date ? false : r.date.replace(/^(\d\d\d\d\-\d\d\-\d\d)\_(\d\d)\-(\d\d)\-(\d\d)$/g,"$1T$2:$3:$4Z") ), // "2021-01-01T00:00:00Z",
    "transaction_bytes": "0x1234567890abcdef",
    "sender": "14Gjs1TD93gnwEBfDMHoCgsuf1s2TVKUP6Z1qKmAZnZ8cW5q",
    recipient: payment_account,
    amount: amount,
    currency: CUR, // currency_block,
    status: (r.payment == "old" || r.payment == "new" ? "finalized" : "pending"),
    }
  ],
};

if(r.hash) ara.hash = r.hash; // added by lleo

res.status(status).send(ara);

});


//          _             _
//    ___  | |_    __ _  | |_   _   _   ___
//   / __| | __|  / _` | | __| | | | | / __|
//   \__ \ | |_  | (_| | | |_  | |_| | \__ \
//   |___/  \__|  \__,_|  \__|  \__,_| |___/
//
app.get("/v2/status", async (req, res) => {

    var nodes = {};
    for(var CUR in DOT.nodes) {
      var N = get_nodes(CUR);
      if(N.api) {
        delete N.api;
        nodes[CUR]=N;
      }
    }

    res.status(200).send({
      server_info: server_info,
      supported_currencies: nodes, // supported_currencies,
    });
});

//      _                      _   _     _
//     | |__     ___    __ _  | | | |_  | |__
//     | '_ \   / _ \  / _` | | | | __| | '_ \
//     | | | | |  __/ | (_| | | | | |_  | | | |
//     |_| |_|  \___|  \__,_| |_|  \__| |_| |_|
//
app.get("/v2/health", async (req, res) => {
    var a={}; for(var x in DOT.nodes) {
        var N=DOT.nodes[x];
        if(N.api && !a[N.rpc_url]) a[N.rpc_url]=N.chain_name;
    }
    var connected_rpcs=[]; for(var x in a) connected_rpcs.push({ rpc_url:x, chain_name:a[x], status: "ok" });
    res.status(200).send({
	server_info: server_info,
	connected_rpcs: connected_rpcs,
	status: "ok"
    });
});



app.get("/*", async (req, res) => {
  console.log("\n--------------------------\nNew user: "+req.url);

  var answer = {
      wss: DOT.chain.wss,
      version: "1.03 nodeJS LLeo",
      recipient: DOT.daemon.destination,
      symbol: DOT.chain.symbol,
      deposit: DOT.chain.deposit,
      fee_planks: DOT.chain.fee_planks,
      ss58: DOT.chain.ss58,
      mul: DOT.daemon.mulx,
  };

  // Error test
  var url = req.url.split("/");
  if(url[1]!='order'|| url[3]!='price'){
    answer.error = "Invalid URL";
    res.status(200).send(answer);
    return;
  }

  answer.price = 1*url[4];
  answer.order = url[2];
  var pair = DOT.D.pay_acc(answer.order);
  answer.pay_account = pair.west; // pub0x;

  if(answer.price <= 0) answer.result = 'waiting';
  else {
    var r = await DOT.D.work(pair, answer.price, answer.order, CUR);
    for(var i in r) answer[i] = r[i];
  }
  res.status(200).send(answer);
});

const httpServer = createServer(app);
// httpServer.on('request', (req, res) => {
//   // res.setHeader('Access-Control-Allow-Origin', '*'); // https://lleo.me');
//   /// res.setHeader('Access-Control-Allow-Origin', 'http://localhost'); // https://lleo.me');
//   res.setHeader('Access-Control-Allow-Origin', '*'); // https://lleo.me');
//   res.setHeader('Access-Control-Allow-Credentials', 'true');
//   res.setHeader('Access-Control-Allow-Headers', 'X-PINGOTHER, Content-Type, x-requested-with');
// });
const io = new Server(httpServer, { cors: { origin: "*", methods: ["GET", "POST"],} });

io.on("connection", (socket) => {
  console.log("We are live and connected");
  console.log(socket.id);
});

httpServer.listen(port, () => {
  console.log(`Starting server: http://localhost:${port}\n\n`);
});