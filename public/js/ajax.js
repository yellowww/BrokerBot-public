var ajax = {
    newReq: function(url,cb) {
      this.callback = cb;
      var req = new XMLHttpRequest();
      var callback = cb;
      req.open('GET',url,true);
      req.addEventListener('load',function() {
        var response = this.responseText;
        var parsedResponse = JSON.parse(response);
        callback(parsedResponse);
      });
      req.addEventListener('error',(err)=> {
        cb({error:true, message:"Server error, check server internet<br>Outdated API keys? Run <div class='codeLine'>node updateKeys.js</div> in you command prompt and refresh the page."});
      });

      req.send();
    },
    ping:(cb)=> {
      fetch('http://1.1.1.1',{ mode: 'no-cors'})
      .then(res=>{cb(true);clearTimeout(timeout)});
      const onError = (callBack) => {
        callBack(false);
        return;
      }
      const timeout = setTimeout(()=>{onError(cb)},2000);
    }
}