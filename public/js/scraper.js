/* Jul11Co (2015) */
$(function() {
  if ($('#back-to-top').length) {
    $(window).bind('scroll', function() {
      var offset = 250;
      if ($(this).scrollTop() > offset) {
        $('#back-to-top').css("bottom", "10px");
      } else {
        $('#back-to-top').css("bottom", "-60px");
      }
    });
    var duration = 200;
    $('#back-to-top').click(function(e) {
      e.preventDefault();
      $('html, body').animate({scrollTop: 0}, duration);
      return false;
    });
  }
});

var updateDateTime = function () {
  var now_moment = moment();
  var yesterday_moment = moment().subtract(1, 'day');
  $(".date-time").each(function(){
    var utc_time = $(this).attr("data-date-time");
    if (utc_time && utc_time != "") {
      var local_time = moment.utc(utc_time).toDate();
      var local_moment = moment(local_time.toISOString());
      var days_diff = now_moment.diff(local_moment, 'days');
      if (days_diff >= 2) { // over 2 days
        if (now_moment.get('year') != local_moment.get('year')) {
          $(this).html(local_moment.format('MMM DD, YYYY hh:mm a'));
        } else {
          $(this).html(local_moment.format('MMM DD, hh:mm a'));
        }
      } else if (days_diff == 1) {
        if (yesterday_moment.date() == local_moment.date()) {
          $(this).html('Yesterday, ' + local_moment.format('hh:mm a'));
        } else {
          $(this).html(local_moment.format('MMM DD, hh:mm a'));
        }
      } else {
        $(this).html(local_moment.fromNow());
      }
    }
  });
}

// Credit: http://stackoverflow.com/questions/280793/case-insensitive-string-replacement-in-javascript
function preg_quote(str) {
  return (str+'').replace(/([\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!\<\>\|\:])/g, "\\$1");
}

// Credit: http://stackoverflow.com/questions/5717093/check-if-a-javascript-string-is-an-url
function isValidURL1(str) {
  var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
    '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
  return pattern.test(str);
}

// Credit: http://stackoverflow.com/questions/1701898/how-to-detect-whether-a-string-is-in-url-format-using-javascript
function isValidURL(s) {
   var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
   return regexp.test(s);
}

// http://stackoverflow.com/questions/736513/how-do-i-parse-a-url-into-hostname-and-path-in-javascript
var getLinkLocation = function(href) {
  var link = document.createElement("a");
  link.href = href;
  return link;
};

var getLinkHostname = function(href) {
  var link = getLinkLocation(href);
  return link.hostname.replace(/(www.)/gm, '').toUpperCase()
}

function escapeRegExp(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

function findURLs(text) {
  var source = (text || '').toString();
  var urlArray = [];
  var url;
  var matchArray;
  // Regular expression to find FTP, HTTP(S) URLs.
  var regexToken = /(((ftp|https?):\/\/)[\-\w@:%_\+.~#?,&\/\/=]+)/g;
  // Iterate through any URLs in the text.
  while( (matchArray = regexToken.exec( source )) !== null ) {
      var token = matchArray[0];
      urlArray.push( token );
  }
  return urlArray;
}
