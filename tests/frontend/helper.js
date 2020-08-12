var helper = {};

(function(){
  var $iframe, jsLibraries = {};

  helper.init = function(cb){
    $.get('/static/js/jquery.js').done(function(code){
      // make sure we don't override existing jquery
      jsLibraries["jquery"] = "if(typeof $ === 'undefined') {\n" + code + "\n}";

      $.get('/tests/frontend/lib/sendkeys.js').done(function(code){
        jsLibraries["sendkeys"] = code;

        cb();
      });
    });
  }

  helper.randomString = function randomString(len)
  {
    var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    var randomstring = '';
    for (var i = 0; i < len; i++)
    {
      var rnum = Math.floor(Math.random() * chars.length);
      randomstring += chars.substring(rnum, rnum + 1);
    }
    return randomstring;
  }

  var getFrameJQuery = function($iframe){
    /*
      I tried over 9000 ways to inject javascript into iframes.
      This is the only way I found that worked in IE 7+8+9, FF and Chrome
    */

    var win = $iframe[0].contentWindow;
    var doc = win.document;

    //IE 8+9 Hack to make eval appear
    //http://stackoverflow.com/questions/2720444/why-does-this-window-object-not-have-the-eval-function
    win.execScript && win.execScript("null");

    win.eval(jsLibraries["jquery"]);
    win.eval(jsLibraries["sendkeys"]);

    win.$.window = win;
    win.$.document = doc;

    return win.$;
  }

  helper.clearSessionCookies = function(){
    // Expire cookies, so author and language are changed after reloading the pad.
    // See https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie#Example_4_Reset_the_previous_cookie
    window.document.cookie = 'token=;expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    window.document.cookie = 'language=;expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  }

  // Can only happen when the iframe exists, so we're doing it separately from other cookies
  helper.clearPadPrefCookie = function(){
    helper.padChrome$.document.cookie = 'prefsHttp=;expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }

  // Overwrite all prefs in pad cookie. Assumes http, not https.
  //
  // `helper.padChrome$.document.cookie` (the iframe) and `window.document.cookie`
  // seem to have independent cookies, UNLESS we put path=/ here (which we don't).
  // I don't fully understand it, but this function seems to properly simulate
  // padCookie.setPref in the client code
  helper.setPadPrefCookie = function(prefs){
    helper.padChrome$.document.cookie = ("prefsHttp=" + escape(JSON.stringify(prefs)) + ";expires=Thu, 01 Jan 3000 00:00:00 GMT");
  }

  // Functionality for knowing what key event type is required for tests
  var evtType = "keydown";
  // if it's IE require keypress
  if(window.navigator.userAgent.indexOf("MSIE") > -1){
    evtType = "keypress";
  }
  // Edge also requires keypress.
  if(window.navigator.userAgent.indexOf("Edge") > -1){
    evtType = "keypress";
  }
  // Opera also requires keypress.
  if(window.navigator.userAgent.indexOf("OPR") > -1){
    evtType = "keypress";
  }
  helper.evtType = evtType;

  // @todo needs fixing asap
  // newPad occasionally timeouts, might be a problem with ready/onload code during page setup
  // This ensures that tests run regardless of this problem
  helper.retry = 0

  helper.newPad = function(cb, padName){
    //build opts object
    var opts = {clearCookies: true}
    if(typeof cb === 'function'){
      opts.cb = cb
    } else {
      opts = _.defaults(cb, opts);
    }

    // if opts.params is set we manipulate the URL to include URL parameters IE ?foo=Bah.
    if(opts.params){
      var encodedParams = "?" + $.param(opts.params);
    }

    //clear cookies
    if(opts.clearCookies){
      helper.clearSessionCookies();
    }

    if(!padName)
      padName = "FRONTEND_TEST_" + helper.randomString(20);
    $iframe = $("<iframe src='/p/" + padName + (encodedParams || '') + "'></iframe>");

    // needed for retry
    let origPadName = padName;

    //clean up inner iframe references
    helper.padChrome$ = helper.padOuter$ = helper.padInner$ = null;

    //remove old iframe
    $("#iframe-container iframe").remove();
    //set new iframe
    $("#iframe-container").append($iframe);
    $iframe.one('load', function(){
      helper.padChrome$ = getFrameJQuery($('#iframe-container iframe'));
      if (opts.clearCookies) {
        helper.clearPadPrefCookie();
      }
      if (opts.padPrefs) {
        helper.setPadPrefCookie(opts.padPrefs);
      }
      helper.waitFor(function(){
        return !$iframe.contents().find("#editorloadingbox").is(":visible");
      }, 10000).done(function(){
        helper.padOuter$  = getFrameJQuery(helper.padChrome$('iframe[name="ace_outer"]'));
        helper.padInner$  = getFrameJQuery( helper.padOuter$('iframe[name="ace_inner"]'));

        //disable all animations, this makes tests faster and easier
        helper.padChrome$.fx.off = true;
        helper.padOuter$.fx.off = true;
        helper.padInner$.fx.off = true;

        opts.cb();
      }).fail(function(){
        if (helper.retry > 3) {
          throw new Error("Pad never loaded");
        }
        helper.retry++;
        helper.newPad(cb,origPadName);
      });
    });

    return padName;
  }

  helper.waitFor = function(conditionFunc, _timeoutTime, _intervalTime){
    var timeoutTime = _timeoutTime || 1900;
    var intervalTime = _intervalTime || 10;

    var deferred = $.Deferred();

    var _fail = deferred.fail;
    var listenForFail = false;
    deferred.fail = function(){
      listenForFail = true;
      _fail.apply(this, arguments);
    }

    var intervalCheck = setInterval(function(){
      var passed = false;

      passed = conditionFunc();

      if(passed){
        clearInterval(intervalCheck);
        clearTimeout(timeout);

        deferred.resolve();
      }
    }, intervalTime);

    var timeout = setTimeout(function(){
      clearInterval(intervalCheck);
      var error = new Error("wait for condition never became true " + conditionFunc.toString());
      deferred.reject(error);

      if(!listenForFail){
        throw error;
      }
    }, timeoutTime);

    return deferred;
  }

  /**
   * Same as `waitFor` but using Promises
   *
   */
  helper.waitForPromise = function(conditionFunc, _timeoutTime, _intervalTime){
    var timeoutTime = _timeoutTime || 1900;
    var intervalTime = _intervalTime || 10;

    var promise = new Promise((resolve, reject) => {
      var intervalCheck = setInterval(function(){
        var passed = false;

        passed = conditionFunc();

        if(passed){
          clearInterval(intervalCheck);
          clearTimeout(timeout);

          resolve();
        }
      }, intervalTime);

      var timeout = setTimeout(function(){
        clearInterval(intervalCheck);
        var error = new Error("wait for condition never became true " + conditionFunc.toString());
        reject(error);

      }, timeoutTime);
    })
    return promise;
  }

  helper.selectLines = function($startLine, $endLine, startOffset, endOffset){
    // if no offset is provided, use beginning of start line and end of end line
    startOffset = startOffset || 0;
    endOffset   = endOffset === undefined ? $endLine.text().length : endOffset;

    var inner$    = helper.padInner$;
    var selection = inner$.document.getSelection();
    var range     = selection.getRangeAt(0);

    var start = getTextNodeAndOffsetOf($startLine, startOffset);
    var end   = getTextNodeAndOffsetOf($endLine, endOffset);

    range.setStart(start.node, start.offset);
    range.setEnd(end.node, end.offset);

    selection.removeAllRanges();
    selection.addRange(range);
  }

  var getTextNodeAndOffsetOf = function($targetLine, targetOffsetAtLine){
    var $textNodes = $targetLine.find('*').contents().filter(function(){
      return this.nodeType === Node.TEXT_NODE;
    });

    // search node where targetOffsetAtLine is reached, and its 'inner offset'
    var textNodeWhereOffsetIs = null;
    var offsetBeforeTextNode = 0;
    var offsetInsideTextNode = 0;
    $textNodes.each(function(index, element){
      var elementTotalOffset = element.textContent.length;
      textNodeWhereOffsetIs = element;
      offsetInsideTextNode = targetOffsetAtLine - offsetBeforeTextNode;

      var foundTextNode = offsetBeforeTextNode + elementTotalOffset >= targetOffsetAtLine;
      if (foundTextNode){
        return false; //stop .each by returning false
      }

      offsetBeforeTextNode += elementTotalOffset;
    });

    // edge cases
    if (textNodeWhereOffsetIs === null){
      // there was no text node inside $targetLine, so it is an empty line (<br>).
      // Use beginning of line
      textNodeWhereOffsetIs = $targetLine.get(0);
      offsetInsideTextNode = 0;
    }
    // avoid errors if provided targetOffsetAtLine is higher than line offset (maxOffset).
    // Use max allowed instead
    var maxOffset = textNodeWhereOffsetIs.textContent.length;
    offsetInsideTextNode = Math.min(offsetInsideTextNode, maxOffset);

    return {
      node: textNodeWhereOffsetIs,
      offset: offsetInsideTextNode,
    };
  }

  /* Ensure console.log doesn't blow up in IE, ugly but ok for a test framework imho*/
  window.console = window.console || {};
  window.console.log = window.console.log || function(){}

  //force usage of callbacks in it
  //var _it = it;
  //it = function(name, func){
  //  if(func && func.length !== 1){
  //    func = function(){
  //      throw new Error("Please use always a callback with it() - " + func.toString());
  //    }
  //  }

  //  _it(name, func);
  //}


  /**
   *
   * Page components
   * Be careful to make them functions, so that they are not executed
   * on tests that don't need all of them
   *
   */


  /**
   * Buttons, icons and ids
   */

  /**
   * Gets the chat icon from the bottom right of the page
   *
   * @returns {HTMLElement} the chat icon
   */
  helper.chatIcon = function(){return helper.padChrome$('#chaticon')}

  /**
   * Gets the titlecross icon
   *
   * @returns {HTMLElement} the titlecross icon
   */
  helper.titlecross = function(){return helper.padChrome$('#titlecross')}

  /**
   * Gets the settings button
   *
   * @returns {HTMLElement} the settings button
   */
  helper.settingsButton = function(){return helper.padChrome$("button[data-l10n-id='pad.toolbar.settings.title']") }

  /**
   * Gets the timeslider button
   *
   * @returns {HTMLElement} the timeslider button
   */
  helper.timesliderButton = function(){return helper.padChrome$("button[data-l10n-id='pad.toolbar.timeslider.title']") }

  /**
   * Gets the settings menu
   *
   * @returns {HTMLElement} the settings menu
   */
  helper.settingsMenu = function(){return helper.padChrome$('#settings') };

  /**
   * Gets the timer div on a timeslider
   *
   * @returns {HTMLElement} timer
   */
  helper.timesliderTimer = function(){return helper.contentWindow().$
    && helper.contentWindow().$('#timer')
  };

  /**
   * Gets the time of the revision on a timeslider
   *
   * @returns {HTMLElement} timer
   */
  helper.timesliderTimerTime = function(){return helper.contentWindow().$
      && helper.contentWindow().$('#timer').text() };

  /**
   * the contentWindow is either the normal pad or timeslider
   *
   * @returns {HTMLElement} contentWindow
   */
  helper.contentWindow = function(){
    return $('#iframe-container iframe')[0].contentWindow;
  }

  /**
   * The ui-slidar-bar element in the timeslider
   */
  helper.sliderBar = function(){
    return helper.contentWindow().$('#ui-slider-bar')
  }

  /**
   * revision_date element
   */
  helper.revisionDateElem = function(){
    return helper.contentWindow().$('#revision_date')
  }

  /**
   * revision_label element
   */
  helper.revisionLabelElem = function(){
    return helper.contentWindow().$('#revision_label')
  }

  /**
   * The pad text as an array of lines
   *
   * @returns {Array.<string>} lines of text
   */
  helper.textLines = function(){
    return helper.padInner$('.ace-line').map(function(){
      return $(this).text()
    }).get()
  }

  /**
   * The pad text as an array of divs
   *
   * @example
   * helper.linesElem()[2].sendkeys('abc') // sends abc to the third line
   *
   * @returns {Array.<HTMLElement>} array of divs
   */
  helper.divLines = function(){
    return helper.padInner$('.ace-line').map(function(){
      return $(this)
    })
  }

  /**
   * Methods
   */

  /**
   * Opens the chat window unless it is already open via an
   * icon on the bottom right of the page
   */
  helper.showChat = function(){
    var chaticon = helper.chatIcon();
    if(chaticon.hasClass('visible')) {
      chaticon.click()
      return helper.waitFor(function(){return !chaticon.hasClass('visible'); },2000)
    }
  }

  /**
   * Closes the chat window if it is shown and not sticky
   */
  helper.hideChat = function(){
    if(helper.isChatboxShown() && !helper.isChatboxSticky()) {
      helper.titlecross().click()
      return helper.waitFor(function(){return !helper.isChatboxShown(); },2000);
    }
  }

  /**
   * Disables the stickyness of the chat window via an icon on the
   * upper right
   */
  helper.disableStickyChatviaIcon = function() {
    if(helper.isChatboxShown() && helper.isChatboxSticky()) {
      helper.titlecross().click()
      return helper.waitFor(function(){return !helper.isChatboxSticky()},2000);
    }
  }

  /**
   * Opens the settings menu if its hidden via button
   */
  helper.showSettings = function() {
    if(!helper.isSettingsShown()){
      helper.settingsButton().click()
      return helper.waitFor(function(){return helper.isSettingsShown(); },2000);
    }
  }

  /**
   * Hide the settings menu if its open via button
   * @todo untested
   */
  helper.hideSettings = function() {
    if(helper.isSettingsShown()){
      helper.settingsButton().click()
      helper.waitFor(function(){return !helper.isSettingsShown(); },2000);
    }
  }

  /**
   * Makes the chat window sticky via settings menu if the settings menu is
   * open and sticky button is not checked
   */
  helper.enableStickyChatviaSettings = function() {
    var stickyChat = helper.padChrome$('#options-stickychat');
    if(helper.isSettingsShown() && !stickyChat.is(':checked')) {
      stickyChat.click();
      return helper.waitFor(function(){
        return helper.isChatboxSticky();
      },2000);
    }
  }

  /**
   * Unsticks the chat window via settings menu if the settings menu is open
   * and sticky button is checked
   */
  helper.disableStickyChatviaSettings = function() {
    var stickyChat = helper.padChrome$('#options-stickychat');
    if(helper.isSettingsShown() && stickyChat.is(':checked')) {
      stickyChat.click();
      return helper.waitFor(function(){return !helper.isChatboxSticky()},2000);
    }
  }

  /**
   * Makes the chat window sticky via an icon on the top right of the chat
   * window
   */
  helper.enableStickyChatviaIcon = function() {
    var stickyChat = helper.padChrome$('#titlesticky');
    if(helper.isChatboxShown() && !helper.isChatboxSticky()) {
      stickyChat.click();
      return helper.waitFor(function(){return helper.isChatboxSticky()},2000);
    }
  }

  /**
   * Sets the src-attribute of the main iframe to the timeslider
   * In case a revision is given, sets the timeslider to this specific revision
   * It waits until the timer is filled with date and time
   * @todo for some reason this does only work the first time, you cannot
   * goto rev 0 and then via the same method to rev 5. Use buttons instead
   *
   * @param {number} [revision] the optional revision
   */
  helper.gotoTimeslider = function(revision){
    revision = revision ? '#'+revision.toString() : '';
    var iframe = $('#iframe-container iframe');
    iframe.attr('src', iframe.attr('src')+'/timeslider' + revision);
    return helper.waitForPromise(function(){return helper.timesliderTimerTime()
      && helper.timesliderTimerTime().match(/[a-z\/: ]+/) },5000);
  }

  /**
   * Enters timeslider via timeslider button
   * It waits until the timer is filled with date and time
   */
  helper.gotoTimesliderviaButton = function(){
    if (!helper.padChrome$.window.location.href.match(/\/timeslider(?:#[0-9]+)?$/)){
      helper.timesliderButton().click();
      return helper.waitForPromise(function(){return helper.timesliderTimerTime()
        && helper.timesliderTimerTime().match(/[a-z\/: ]+/) },10000);
    }
  }

  /**
   * Saves a revision
   * @todo wait for SAVE_REVISION message from server
   */
  helper.saveRevision = function(){
    helper.saveRevisionButton().click()
    return helper.waitForPromise(function(){return $('.saved-revision').is(':visible')})
  }

  /**
   * The save revision button
   */
  helper.saveRevisionButton = function(){
    return $('.buttonicon-savedRevision');
  }

  /**
   * An array of divs that represent the saved revisions
   * @todo check position etc
   */
  helper.savedRevisionStars = function(){
    return $('.star')
  }

  /**
   * Sends a chat `message` via `sendKeys`
   *
   * @param {string} message the chat message to be sent
   */
  helper.sendChatMessage = function(message){
    helper.padChrome$("#chatinput").sendkeys(message)
  }

  /**
   * Clicks in the timeslider at a specific offset
   * It's used to navigate the timeslider
   *
   * @todo no mousemove test
   * @param {number} X coordinate
   */
  helper.sliderClick = function(X){
    let sliderBar = helper.sliderBar()
    let edown = new jQuery.Event('mousedown');
    let eup = new jQuery.Event('mouseup');
    edown.clientX = eup.clientX = X;
    edown.clientY = eup.clientY = sliderBar.offset().top;

    sliderBar.trigger(edown);
    sliderBar.trigger(eup);
  }

  /**
   * UI
   */

  /**
   * Returns true if the settings menu is visible
   *
   * @returns {boolean} is the settings menu shown?
   */
  helper.isSettingsShown = function() {
    return helper.padChrome$('#settings').hasClass('popup-show');
  }

  /**
   * Returns true if the chat box is shown
   *
   * @returns {boolean} visibility of the chat box
   */
  helper.isChatboxShown = function() {
    return helper.padChrome$('#chatbox').hasClass('visible');
  }

  /**
   * Returns true if the chat box is sticky
   *
   * @returns {boolean} stickyness of the chat box
   */
  helper.isChatboxSticky = function() {
    return helper.padChrome$('#chatbox').hasClass('stickyChat');
  }

})()
