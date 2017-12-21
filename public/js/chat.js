$(function () {
    var socket = io();
    $('form').submit(function(){
        socket.emit('chat message', $('#m').val());
        $('#m').val('');
        return false;
    });
    socket.on('chat message',function(msg){
        $('#messages').append($('&lt;li&gt;').text(msg).addClass('balloon-left').wrap('<div />'));
        });
        socket.on('bot message', function(msg){
          $('#messages').append($('&lt;li&gt;').text('：'+msg).addClass('balloon-left').wrap('<div />'));
        });          
      });