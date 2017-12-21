
const PORT_NUMBER = 3000;

const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);



app.use(express.static('public'));
app.use(express.static('./public')); // load UI from public folder

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
    var ConversationV1 = require('watson-developer-cloud/conversation/v1');

    //Set up Conversation Service.
    var conversation = new ConversationV1({
        url: 'https://gateway.watsonplatform.net/conversation/api',
        username: '4239bea9-5971-4038-a9b4-5be612bd56f9', // ユーザー名を置き換えてください。
        password: 'fNTXUFUI7kqM', // パスワードを置き換えてください。
        path: { workspace_id: 'dc19b29e-86be-4673-acbf-7456f8893d91'}, // ワークスペースIDを置き換えてください。
        version_date: '2017-08-01'//何でもいいのかも？
      });

    //Set up Discovery Service
    var DiscoveryV1 = require('watson-developer-cloud/discovery/v1');
    //discovery config
    var discovery = new DiscoveryV1({
        username: '3880a008-1eac-4fa6-9ed9-39db785195d3',
        password: 'BbNVBRp5e0vE',
        version_date: '2017-05-26'
    });

    var res = [];
    // このページにアクセスしたときに、空のメッセージをConversationに投げる
    conversation.message({}, processResponse);

    // Conversationのレスポンスを取得する
    function processResponse(err, response) {
        if (err) {
          console.error(err); // something went wrong
          return;
        }
        // intentがマッチしたらコンソールに出力する
        if (response.intents.length > 0) {
            console.log('chat message', 'Detected intent: #' + response.intents[0].intent);
            console.log(response.input.text);
        } 
       // 何らかの返答があれば、それをbotからの返答として全て返す(ループはjump to の時に必要)
        for (var i = 0, len = response.output.text.length; i < len; i++) {
            if(response.output.text[i] !== ''){ 
              console.log(':'+response.output.action);
                CallDiscovery(response.input.text,response);
                //io.to(socket.id).emit('bot message', response.output.text[i]);                
            }
        }
        res[socket.id] = response;
    }

    //Call Discovery
    function CallDiscovery(input, response) {
      //ユーザーの入力文を取得
      //var myQuery =input.text;
      console.log(':::'+input);

      //discovery params for methods
      var params = {
        'query': input,
        //these values are inside the .env file
        'environment_id': '696ccc49-8ad5-41f8-b12e-ae6c80108cc1',
        'collection_id': '49d53c05-5a3c-4fc9-894d-8c15d43c9f39',
        'configuration_id': '0d828cba-d8b4-47cb-b25f-27356b5359a4',
        'passages': true, //if you want to disable, set to false
        return: 'text, title'
        //  highlight: true // if you want to enable, uncomment
        }

      if (!response.output) {
          response.output = {};
      } else if (response.output.action) {
          console.log('Calling discovery.. ');
  
          discovery.query(params, (error, results) => {
              if (error) {
                next(error);
              } else {
                console.log(results);              
                //sending the result for the user...
                response.output.text = 'Discovery call with success, check the results: <br>' + results.passages[0].passage_text;
                io.to(socket.id).emit('bot message', response.output.text);             
              };
          });
  
      } else if (response.output && response.output.text) {
        io.to(socket.id).emit('bot message', response.output.text);  
      }
      res[socket.id] = response;
  }

    //新しいメッセージを受信したときの動作
    socket.on('chat message', function(msg){
        //受信したメッセージをそのまま、チャット画面に表示
        io.to(socket.id).emit('chat message',msg);
        // 受信したメッセージをAPIに投げる
        conversation.message({
          input: { text: msg },
          context : res[socket.id].context
        }, processResponse);
        console.log('マジな方はこっち？')
    });
});

http.listen(PORT_NUMBER, () => {
  console.log(`Example app listening at http://localhost:${PORT_NUMBER}`);
});