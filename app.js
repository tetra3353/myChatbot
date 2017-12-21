
const PORT_NUMBER = 3000;

const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);



app.use(express.static('public'));

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
        } 
       // 何らかの返答があれば、それをbotからの返答として全て返す(ループはjump to の時に必要)
        for (var i = 0, len = response.output.text.length; i < len; i++) {
            if(response.output.text[i] !== ''){ 
                io.to(socket.id).emit('bot message', response.output.text[i]);                
            }
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
    });
});

http.listen(PORT_NUMBER, () => {
  console.log(`Example app listening at http://localhost:${PORT_NUMBER}`);
});