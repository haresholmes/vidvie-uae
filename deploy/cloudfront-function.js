// CloudFront Function "vidvie-pages" (viewer request) on distribution
// E1J25ISXSFTE16. The site is folders of index.html files in a private S3
// bucket, which knows nothing about "directory index" pages, so:
//   www.vidvie.ae/...      -> 301 to vidvie.ae/... (one address for Google)
//   /c/audio/              -> serves /c/audio/index.html
//   /c/audio               -> 301 to /c/audio/
// Files with an extension (styles.css, sitemap.xml) pass through unchanged.
function handler(event) {
  var request = event.request;
  var host = request.headers.host ? request.headers.host.value : '';
  var uri = request.uri;
  var qs = '';
  var keys = Object.keys(request.querystring);
  if (keys.length) {
    var parts = [];
    keys.forEach(function (k) {
      var item = request.querystring[k];
      var values = item.multiValue ? item.multiValue : [item];
      values.forEach(function (v) { parts.push(k + (v.value === '' ? '' : '=' + v.value)); });
    });
    qs = '?' + parts.join('&');
  }
  if (host === 'www.vidvie.ae') {
    return { statusCode: 301, statusDescription: 'Moved Permanently', headers: { location: { value: 'https://vidvie.ae' + uri + qs } } };
  }
  if (uri.endsWith('/')) {
    request.uri = uri + 'index.html';
  } else if (uri.split('/').pop().indexOf('.') === -1) {
    return { statusCode: 301, statusDescription: 'Moved Permanently', headers: { location: { value: uri + '/' + qs } } };
  }
  return request;
}
