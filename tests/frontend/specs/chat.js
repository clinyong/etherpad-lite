describe("Chat messages and UI", function(){
  //create a new pad before each test run
  beforeEach(function(cb){
    helper.newPad(cb);
    this.timeout(60000);
  });

  it("opens chat, sends a message and makes sure it exists on the page", function(done) {
    var chrome$ = helper.padChrome$;
    var chatValue = "JohnMcLear";

    helper.showChat();

    helper.sendChatMessage(chatValue); // simulate a keypress of typing JohnMcLear
    helper.sendChatMessage('{enter}'); // simulate a keypress of enter actually does evt.which = 10 not 13

    //check if chat shows up
    helper.waitFor(function(){
      return chrome$("#chattext").children("p").length !== 0; // wait until the chat message shows up
    }).done(function(){
      var $firstChatMessage = chrome$("#chattext").children("p");
      var containsMessage = $firstChatMessage.text().indexOf("JohnMcLear") !== -1; // does the string contain JohnMcLear?
      expect(containsMessage).to.be(true); // expect the first chat message to contain JohnMcLear

      // do a slightly more thorough check
      var username = $firstChatMessage.children("b");
      var usernameValue = username.text();
      var time = $firstChatMessage.children(".time");
      var timeValue = time.text();
      var discoveredValue = $firstChatMessage.text();
      var chatMsgExists = (discoveredValue.indexOf("JohnMcLear") !== -1);
      expect(chatMsgExists).to.be(true);
      done();
    });

  });

  it("makes sure that an empty message can't be sent", function(done) {
    var chrome$ = helper.padChrome$;

    helper.showChat();

    helper.sendChatMessage('{enter}'); // simulate a keypress of enter (to send an empty message)
    helper.sendChatMessage('mluto'); // simulate a keypress of typing mluto
    helper.sendChatMessage('{enter}'); // simulate a keypress of enter (to send 'mluto')

    //check if chat shows up
    helper.waitFor(function(){
      return chrome$("#chattext").children("p").length !== 0; // wait until the chat message shows up
    }).done(function(){
      // check that the empty message is not there
      expect(chrome$("#chattext").children("p").length).to.be(1);
      // check that the received message is not the empty one
      var $firstChatMessage = chrome$("#chattext").children("p");
      var containsMessage = $firstChatMessage.text().indexOf("mluto") !== -1;
      expect(containsMessage).to.be(true);
      done();
    });
  });

  it("makes chat stick to right side of the screen via settings, then close it", function(done) {
    helper.showSettings()
    .done(function(){
      helper.enableStickyChatviaSettings()
      .done(function(){
        expect(helper.isChatboxShown()).to.be(true);
        expect(helper.isChatboxSticky()).to.be(true);
        helper.disableStickyChatviaSettings()
        .done(function(){
          expect(helper.isChatboxSticky()).to.be(false);
          expect(helper.isChatboxShown()).to.be(true);
          helper.hideChat()
          .done(function(){
            expect(helper.isChatboxSticky()).to.be(false);
            expect(helper.isChatboxShown()).to.be(false);
            done();
          })
        })
      })
    })
  })

  it("makes chat stick to right side of the screen via icon on the top right, then remove sticky again", function(done) {
    helper.showChat()
    .done(function(){
      helper.enableStickyChatviaIcon()
      .done(function(){
        expect(helper.isChatboxShown()).to.be(true);
        expect(helper.isChatboxSticky()).to.be(true);
        helper.disableStickyChatviaIcon()
        .done(function(){
          expect(helper.isChatboxShown()).to.be(true);
          expect(helper.isChatboxSticky()).to.be(false);
          done();
        })
      })
    })
  });

  it("titlecross icon can remove sticky and close chatbox ", function(done) {
    helper.showChat()
    .done(function(){
      helper.enableStickyChatviaIcon()
      .done(function(){
        expect(helper.isChatboxShown()).to.be(true);
        expect(helper.isChatboxSticky()).to.be(true);
        helper.disableStickyChatviaIcon()
        .done(function(){
          expect(helper.isChatboxShown()).to.be(true);
          expect(helper.isChatboxSticky()).to.be(false);
          helper.hideChat()
          .done(function(){
            expect(helper.isChatboxShown()).to.be(false);
            expect(helper.isChatboxSticky()).to.be(false);
          done();
          })
        })
      })
    })
  });

  xit("Checks showChat=false URL Parameter hides chat then when removed it shows chat", function(done) {
    this.timeout(60000);

    setTimeout(function(){ //give it a second to save the username on the server side
      helper.newPad({ // get a new pad, but don't clear the cookies
        clearCookies: false,
        params:{
          showChat: "false"
        }, cb: function(){
          expect(helper.chaticon.is(":visible")).to.be(false);

          setTimeout(function(){ //give it a second to save the username on the server side
            helper.newPad({ // get a new pad, but don't clear the cookies
              clearCookies: false
              , cb: function(){
                expect(helper.chaticon.is(":visible")).to.be(true);
                done();
              }
            });
          }, 1000);

        }
      });
    }, 1000);

  });

});
