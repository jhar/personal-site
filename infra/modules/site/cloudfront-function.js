// Viewer-request function for the S3 origin. Next's static export writes
// /about as about.html, so extensionless paths get ".html" and directory
// paths get "index.html". Paths with an extension pass through unchanged.
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- called by CloudFront
function handler(event) {
  var request = event.request;
  var uri = request.uri;

  if (uri.endsWith("/")) {
    request.uri = uri + "index.html";
  } else if (uri.split("/").pop().indexOf(".") === -1) {
    request.uri = uri + ".html";
  }

  return request;
}
